import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// Chore interfaces
interface Chore {
  id: string;
  family_id: string;
  title: string;
  description: string;
  points_value: number;
  assigned_to: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'pending_approval';
  due_date: string | null;
  completed_at: string | null;
  estimated_time_minutes: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ChoreAssignment {
  id: string;
  chore_id: string;
  user_id: string;
  assigned_at: string;
  status: 'active' | 'completed' | 'overdue';
}

interface ChoreCompletion {
  id: string;
  chore_id: string;
  user_id: string;
  completed_at: string;
  notes: string | null;
  photo_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
}

interface ChoreTemplate {
  id: string;
  title: string;
  description: string;
  points_value: number;
  estimated_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  autism_friendly: boolean;
}

// Filter and sort options
interface ChoreFilter {
  status?: string[];
  assignedTo?: string[];
  difficulty?: string[];
  dateRange?: { start: string; end: string };
  familyId?: string;
}

interface ChoreSortOption {
  field: 'due_date' | 'points_value' | 'difficulty' | 'created_at';
  direction: 'asc' | 'desc';
}

// Chore lifecycle management state
interface ChoreState {
  // Chore Data
  chores: Chore[];
  assignments: ChoreAssignment[];
  completions: ChoreCompletion[];
  templates: ChoreTemplate[];
  
  // UI State
  selectedChore: string | null;
  currentFilter: ChoreFilter;
  currentSort: ChoreSortOption;
  viewMode: 'list' | 'calendar' | 'kanban';
  
  // Loading States
  loading: boolean;
  loadingTemplates: boolean;
  loadingAssignments: boolean;
  savingChore: boolean;
  
  // Cache State
  lastFetch: Date | null;
  familyId: string | null;
  
  // Actions
  fetchChores: (familyId: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchAssignments: (familyId: string) => Promise<void>;
  fetchCompletions: (familyId: string) => Promise<void>;
  
  createChore: (choreData: Partial<Chore>) => Promise<Chore>;
  updateChore: (choreId: string, updates: Partial<Chore>) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;
  
  assignChore: (choreId: string, userId: string) => Promise<void>;
  unassignChore: (choreId: string) => Promise<void>;
  
  completeChore: (choreId: string, completionData: Partial<ChoreCompletion>) => Promise<void>;
  approveCompletion: (completionId: string) => Promise<void>;
  rejectCompletion: (completionId: string, reason: string) => Promise<void>;
  
  // Batch operations
  bulkAssignChores: (choreIds: string[], userId: string) => Promise<void>;
  bulkUpdateStatus: (choreIds: string[], status: string) => Promise<void>;
  
  // Filtering and sorting
  setFilter: (filter: Partial<ChoreFilter>) => void;
  clearFilter: () => void;
  setSort: (sort: ChoreSortOption) => void;
  
  // UI Management
  setSelectedChore: (choreId: string | null) => void;
  setViewMode: (mode: 'list' | 'calendar' | 'kanban') => void;
  
  // Utilities
  getFilteredChores: () => Chore[];
  getChoresByUser: (userId: string) => Chore[];
  getOverdueChores: () => Chore[];
  getCompletionRate: (userId: string, dateRange?: { start: string; end: string }) => number;
}

// Real-time subscription management
let choreSubscription: any = null;

export const useChoreStore = create<ChoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        chores: [],
        assignments: [],
        completions: [],
        templates: [],
        selectedChore: null,
        currentFilter: {},
        currentSort: { field: 'due_date', direction: 'asc' },
        viewMode: 'list',
        loading: false,
        loadingTemplates: false,
        loadingAssignments: false,
        savingChore: false,
        lastFetch: null,
        familyId: null,

        // Fetch chores with real-time subscription
        fetchChores: async (familyId: string) => {
          try {
            set({ loading: true, familyId });

            const { data, error } = await supabase
              .from('chores')
              .select('*')
              .eq('family_id', familyId)
              .order('created_at', { ascending: false });

            if (error) throw error;

            set({ chores: (data || []) as Chore[], lastFetch: new Date(), loading: false });

            // Set up real-time subscription
            if (choreSubscription) {
              choreSubscription.unsubscribe();
            }

            choreSubscription = supabase
              .channel('chores-changes')
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'chores',
                  filter: `family_id=eq.${familyId}`,
                },
                (payload) => {
                  const currentChores = get().chores;
                  
                  if (payload.eventType === 'INSERT') {
                    set({ chores: [payload.new as Chore, ...currentChores] });
                  } else if (payload.eventType === 'UPDATE') {
                    set({
                      chores: currentChores.map(chore =>
                        chore.id === payload.new.id ? payload.new as Chore : chore
                      )
                    });
                  } else if (payload.eventType === 'DELETE') {
                    set({
                      chores: currentChores.filter(chore => chore.id !== payload.old.id)
                    });
                  }
                }
              )
              .subscribe();

          } catch (error) {
            console.error('Error fetching chores:', error);
            set({ loading: false });
          }
        },

        // Fetch chore templates from database
        fetchTemplates: async () => {
          try {
            set({ loadingTemplates: true });

            const { data, error } = await supabase
              .from('chore_templates')
              .select('*')
              .eq('is_active', true)
              .order('category', { ascending: true })
              .order('title', { ascending: true });

            if (error) throw error;

            const templates: ChoreTemplate[] = (data || []).map(template => ({
              id: template.id,
              title: template.title,
              description: template.description || '',
              points_value: template.points_value,
              estimated_time_minutes: template.estimated_time_minutes || 0,
              difficulty: template.difficulty as 'easy' | 'medium' | 'hard',
              category: template.category,
              autism_friendly: template.autism_friendly,
            }));

            set({ templates, loadingTemplates: false });
          } catch (error) {
            console.error('Error fetching templates:', error);
            set({ loadingTemplates: false });
          }
        },

        // Fetch assignments
        fetchAssignments: async (familyId: string) => {
          try {
            set({ loadingAssignments: true });

            // This would be a proper assignments table query
            // For now, derive from chores with assigned_to
            const chores = get().chores;
            const assignments: ChoreAssignment[] = chores
              .filter(chore => chore.assigned_to)
              .map(chore => ({
                id: `${chore.id}-assignment`,
                chore_id: chore.id,
                user_id: chore.assigned_to!,
                assigned_at: chore.created_at,
                status: chore.status === 'completed' ? 'completed' : 'active',
              }));

            set({ assignments, loadingAssignments: false });
          } catch (error) {
            console.error('Error fetching assignments:', error);
            set({ loadingAssignments: false });
          }
        },

        // Fetch completions
        fetchCompletions: async (familyId: string) => {
          try {
            // This would query a completions table
            // For now, derive from completed chores
            const chores = get().chores;
            const completions: ChoreCompletion[] = chores
              .filter(chore => chore.status === 'completed' && chore.completed_at)
              .map(chore => ({
                id: `${chore.id}-completion`,
                chore_id: chore.id,
                user_id: chore.assigned_to!,
                completed_at: chore.completed_at!,
                notes: null,
                photo_url: null,
                verification_status: 'approved',
              }));

            set({ completions });
          } catch (error) {
            console.error('Error fetching completions:', error);
          }
        },

        // Create new chore
        createChore: async (choreData: Partial<Chore>) => {
          try {
            set({ savingChore: true });

            const { data, error } = await supabase
              .from('chores')
              .insert(choreData as any)
              .select()
              .single();

            if (error) throw error;

            set({ savingChore: false });
            return data as Chore;
          } catch (error) {
            console.error('Error creating chore:', error);
            set({ savingChore: false });
            throw error;
          }
        },

        // Update chore
        updateChore: async (choreId: string, updates: Partial<Chore>) => {
          try {
            const { error } = await supabase
              .from('chores')
              .update(updates as any)
              .eq('id', choreId);

            if (error) throw error;

            // Optimistic update
            set(state => ({
              chores: state.chores.map(chore =>
                chore.id === choreId ? { ...chore, ...updates } : chore
              )
            }));
          } catch (error) {
            console.error('Error updating chore:', error);
            throw error;
          }
        },

        // Delete chore
        deleteChore: async (choreId: string) => {
          try {
            const { error } = await supabase
              .from('chores')
              .delete()
              .eq('id', choreId);

            if (error) throw error;

            // Optimistic update
            set(state => ({
              chores: state.chores.filter(chore => chore.id !== choreId)
            }));
          } catch (error) {
            console.error('Error deleting chore:', error);
            throw error;
          }
        },

        // Assign chore to user
        assignChore: async (choreId: string, userId: string) => {
          await get().updateChore(choreId, { assigned_to: userId });
        },

        // Unassign chore
        unassignChore: async (choreId: string) => {
          await get().updateChore(choreId, { assigned_to: null });
        },

        // Complete chore
        completeChore: async (choreId: string, completionData: Partial<ChoreCompletion>) => {
          await get().updateChore(choreId, {
            status: 'completed',
            completed_at: new Date().toISOString(),
          });

          // In a full implementation, this would also create a completion record
          // with photo verification, notes, etc.
        },

        // Approve completion
        approveCompletion: async (completionId: string) => {
          // This would update the completion verification status
          // and trigger point allocation
          const completion = get().completions.find(c => c.id === completionId);
          if (completion) {
            await get().updateChore(completion.chore_id, { status: 'pending_approval' });
          }
        },

        // Reject completion
        rejectCompletion: async (completionId: string, reason: string) => {
          const completion = get().completions.find(c => c.id === completionId);
          if (completion) {
            await get().updateChore(completion.chore_id, {
              status: 'in_progress',
              completed_at: null,
            });
          }
        },

        // Bulk operations
        bulkAssignChores: async (choreIds: string[], userId: string) => {
          const updates = choreIds.map(id => 
            get().updateChore(id, { assigned_to: userId })
          );
          await Promise.all(updates);
        },

        bulkUpdateStatus: async (choreIds: string[], status: string) => {
          const updates = choreIds.map(id => 
            get().updateChore(id, { status: status as any })
          );
          await Promise.all(updates);
        },

        // Filtering and sorting
        setFilter: (filter: Partial<ChoreFilter>) => {
          set(state => ({
            currentFilter: { ...state.currentFilter, ...filter }
          }));
        },

        clearFilter: () => set({ currentFilter: {} }),

        setSort: (sort: ChoreSortOption) => set({ currentSort: sort }),

        // UI Management
        setSelectedChore: (choreId: string | null) => set({ selectedChore: choreId }),
        setViewMode: (mode: 'list' | 'calendar' | 'kanban') => set({ viewMode: mode }),

        // Utility functions
        getFilteredChores: () => {
          const { chores, currentFilter, currentSort } = get();
          let filtered = [...chores];

          // Apply filters
          if (currentFilter.status?.length) {
            filtered = filtered.filter(chore => currentFilter.status!.includes(chore.status));
          }

          if (currentFilter.assignedTo?.length) {
            filtered = filtered.filter(chore => 
              chore.assigned_to && currentFilter.assignedTo!.includes(chore.assigned_to)
            );
          }

          if (currentFilter.difficulty?.length) {
            filtered = filtered.filter(chore => currentFilter.difficulty!.includes(chore.difficulty));
          }

          // Apply sorting
          filtered.sort((a, b) => {
            const aVal = a[currentSort.field];
            const bVal = b[currentSort.field];
            
            if (aVal === null) return 1;
            if (bVal === null) return -1;
            
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return currentSort.direction === 'asc' ? comparison : -comparison;
          });

          return filtered;
        },

        getChoresByUser: (userId: string) => {
          return get().chores.filter(chore => chore.assigned_to === userId);
        },

        getOverdueChores: () => {
          const now = new Date();
          return get().chores.filter(chore => 
            chore.due_date && 
            new Date(chore.due_date) < now && 
            chore.status !== 'completed'
          );
        },

        getCompletionRate: (userId: string, dateRange?: { start: string; end: string }) => {
          const userChores = get().getChoresByUser(userId);
          
          let filteredChores = userChores;
          if (dateRange) {
            filteredChores = userChores.filter(chore => {
              const created = new Date(chore.created_at);
              return created >= new Date(dateRange.start) && created <= new Date(dateRange.end);
            });
          }

          if (filteredChores.length === 0) return 0;
          
          const completed = filteredChores.filter(chore => chore.status === 'completed').length;
          return (completed / filteredChores.length) * 100;
        },
      }),
      {
        name: 'chore-store',
        partialize: (state) => ({
          currentFilter: state.currentFilter,
          currentSort: state.currentSort,
          viewMode: state.viewMode,
        }),
      }
    ),
    {
      name: 'chore-store',
    }
  )
);

// Cleanup subscription on store destruction
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (choreSubscription) {
      choreSubscription.unsubscribe();
    }
  });
}