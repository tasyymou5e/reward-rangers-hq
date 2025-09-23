import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// System health metrics interface
interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  activeUsers: number;
  errorRate: number;
  responseTime: number;
  databaseConnections: number;
  lastCheck: Date;
}

// User metrics interface
interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers24h: number;
  retentionRate: number;
  avgSessionDuration: number;
}

// Family metrics interface
interface FamilyMetrics {
  totalFamilies: number;
  activeFamilies: number;
  avgFamilySize: number;
  choresCompleted24h: number;
}

// Security metrics interface
interface SecurityMetrics {
  securityAlerts: number;
  failedLoginAttempts: number;
  suspiciousActivity: number;
  resolvedIncidents: number;
}

// Admin-specific state management
interface AdminState {
  // System Monitoring
  systemHealth: SystemHealth | null;
  userMetrics: UserMetrics | null;
  familyMetrics: FamilyMetrics | null;
  securityMetrics: SecurityMetrics | null;
  
  // Management State
  selectedUsers: string[];
  selectedFamilies: string[];
  bulkOperationInProgress: boolean;
  
  // UI State
  activeTab: string;
  refreshInterval: number;
  autoRefresh: boolean;
  
  // Loading States
  loadingMetrics: boolean;
  loadingUsers: boolean;
  loadingFamilies: boolean;
  
  // Actions
  fetchSystemHealth: () => Promise<void>;
  fetchUserMetrics: () => Promise<void>;
  fetchFamilyMetrics: () => Promise<void>;
  fetchSecurityMetrics: () => Promise<void>;
  fetchAllMetrics: () => Promise<void>;
  
  bulkUpdateUsers: (userIds: string[], updates: any) => Promise<void>;
  bulkDeleteUsers: (userIds: string[]) => Promise<void>;
  createTestFamilies: (count: number, options?: any) => Promise<void>;
  
  setSelectedUsers: (userIds: string[]) => void;
  setSelectedFamilies: (familyIds: string[]) => void;
  clearSelections: () => void;
  
  setActiveTab: (tab: string) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

let refreshTimer: NodeJS.Timeout | null = null;

export const useAdminStore = create<AdminState>()(
  devtools(
    (set, get) => ({
      // Initial state
      systemHealth: null,
      userMetrics: null,
      familyMetrics: null,
      securityMetrics: null,
      selectedUsers: [],
      selectedFamilies: [],
      bulkOperationInProgress: false,
      activeTab: 'dashboard',
      refreshInterval: 30000, // 30 seconds
      autoRefresh: false,
      loadingMetrics: false,
      loadingUsers: false,
      loadingFamilies: false,

      // System health monitoring
      fetchSystemHealth: async () => {
        try {
          set({ loadingMetrics: true });
          
          // Fetch basic system metrics
          const [usersResponse, alertsResponse] = await Promise.all([
            supabase.from('profiles').select('id, last_activity').gte('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
            supabase.from('security_alerts').select('id, severity').eq('resolved', false)
          ]);

          const activeUsers = usersResponse.data?.length || 0;
          const criticalAlerts = alertsResponse.data?.filter(alert => alert.severity === 'critical').length || 0;
          
          const systemHealth: SystemHealth = {
            status: criticalAlerts > 0 ? 'critical' : activeUsers < 5 ? 'warning' : 'healthy',
            uptime: performance.now() / 1000 / 60 / 60, // hours
            activeUsers,
            errorRate: criticalAlerts / Math.max(activeUsers, 1) * 100,
            responseTime: 120, // ms - would be calculated from actual metrics
            databaseConnections: 5, // would come from DB metrics
            lastCheck: new Date(),
          };

          set({ systemHealth, loadingMetrics: false });
        } catch (error) {
          console.error('Error fetching system health:', error);
          set({ loadingMetrics: false });
        }
      },

      // User metrics
      fetchUserMetrics: async () => {
        try {
          const [totalUsersResponse, activeUsersResponse, newUsersResponse] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact' }),
            supabase.from('profiles').select('id').gte('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
            supabase.from('profiles').select('id').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          ]);

          const userMetrics: UserMetrics = {
            totalUsers: totalUsersResponse.count || 0,
            activeUsers: activeUsersResponse.data?.length || 0,
            newUsers24h: newUsersResponse.data?.length || 0,
            retentionRate: 85, // Would be calculated from actual retention data
            avgSessionDuration: 25, // minutes - would come from session tracking
          };

          set({ userMetrics });
        } catch (error) {
          console.error('Error fetching user metrics:', error);
        }
      },

      // Family metrics
      fetchFamilyMetrics: async () => {
        try {
          const [familiesResponse, choresResponse] = await Promise.all([
            supabase.from('families').select('id'),
            supabase.from('chores').select('id').eq('status', 'completed').gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          ]);

          const familyMetrics: FamilyMetrics = {
            totalFamilies: familiesResponse.data?.length || 0,
            activeFamilies: Math.floor((familiesResponse.data?.length || 0) * 0.7), // Estimate
            avgFamilySize: 3.2, // Would be calculated from family_members
            choresCompleted24h: choresResponse.data?.length || 0,
          };

          set({ familyMetrics });
        } catch (error) {
          console.error('Error fetching family metrics:', error);
        }
      },

      // Security metrics
      fetchSecurityMetrics: async () => {
        try {
          const [alertsResponse, authResponse] = await Promise.all([
            supabase.from('security_alerts').select('id, severity, resolved'),
            supabase.from('auth_rate_limits').select('id, attempt_count').gte('last_attempt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          ]);

          const alerts = alertsResponse.data || [];
          const securityMetrics: SecurityMetrics = {
            securityAlerts: alerts.filter(a => !a.resolved).length,
            failedLoginAttempts: authResponse.data?.reduce((sum, r) => sum + r.attempt_count, 0) || 0,
            suspiciousActivity: alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
            resolvedIncidents: alerts.filter(a => a.resolved).length,
          };

          set({ securityMetrics });
        } catch (error) {
          console.error('Error fetching security metrics:', error);
        }
      },

      // Fetch all metrics
      fetchAllMetrics: async () => {
        const actions = [
          get().fetchSystemHealth(),
          get().fetchUserMetrics(),
          get().fetchFamilyMetrics(),
          get().fetchSecurityMetrics(),
        ];

        await Promise.allSettled(actions);
      },

      // Bulk user operations
      bulkUpdateUsers: async (userIds: string[], updates: any) => {
        try {
          set({ bulkOperationInProgress: true });
          
          // For now, update users individually
          const updatePromises = userIds.map(userId =>
            supabase.from('profiles').update(updates).eq('id', userId)
          );
          
          await Promise.all(updatePromises);

          // Refresh metrics after bulk operation
          await get().fetchUserMetrics();
          
        } catch (error) {
          console.error('Error in bulk update:', error);
          throw error;
        } finally {
          set({ bulkOperationInProgress: false });
        }
      },

      bulkDeleteUsers: async (userIds: string[]) => {
        try {
          set({ bulkOperationInProgress: true });
          
          // For now, delete users individually (should be done carefully)
          const deletePromises = userIds.map(userId =>
            supabase.from('profiles').delete().eq('id', userId)
          );
          
          await Promise.all(deletePromises);

          await get().fetchUserMetrics();
          
        } catch (error) {
          console.error('Error in bulk delete:', error);
          throw error;
        } finally {
          set({ bulkOperationInProgress: false });
        }
      },

      // Test family creation
      createTestFamilies: async (count: number, options: any = {}) => {
        try {
          set({ bulkOperationInProgress: true });
          
          await supabase.functions.invoke('create-test-family', {
            body: { count, options }
          });

          await get().fetchFamilyMetrics();
          
        } catch (error) {
          console.error('Error creating test families:', error);
          throw error;
        } finally {
          set({ bulkOperationInProgress: false });
        }
      },

      // Selection management
      setSelectedUsers: (userIds: string[]) => set({ selectedUsers: userIds }),
      setSelectedFamilies: (familyIds: string[]) => set({ selectedFamilies: familyIds }),
      clearSelections: () => set({ selectedUsers: [], selectedFamilies: [] }),

      // UI management
      setActiveTab: (tab: string) => set({ activeTab: tab }),
      
      setAutoRefresh: (enabled: boolean) => {
        set({ autoRefresh: enabled });
        if (enabled) {
          get().startAutoRefresh();
        } else {
          get().stopAutoRefresh();
        }
      },

      setRefreshInterval: (interval: number) => {
        set({ refreshInterval: interval });
        if (get().autoRefresh) {
          get().stopAutoRefresh();
          get().startAutoRefresh();
        }
      },

      // Auto-refresh management
      startAutoRefresh: () => {
        const interval = get().refreshInterval;
        refreshTimer = setInterval(() => {
          get().fetchAllMetrics();
        }, interval);
      },

      stopAutoRefresh: () => {
        if (refreshTimer) {
          clearInterval(refreshTimer);
          refreshTimer = null;
        }
      },
    }),
    {
      name: 'admin-store',
    }
  )
);