import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdmin() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllUsers = async () => {
    try {
      console.log('🔍 Admin: Starting to fetch all users...');
      
      // First check if we have admin permissions
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id, user?.email);
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Use the new admin-specific function that bypasses RLS
      console.log('🔒 Using admin-specific function to fetch profiles...');
      const { data, error } = await supabase.rpc('get_all_profiles_for_admin');
      
      if (error) {
        console.error('❌ Admin profiles fetch error:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ Users fetch successful:', data?.length || 0, 'users found');
      console.log('📋 User data preview:', data?.slice(0, 2));
      
      return data || [];
    } catch (error) {
      console.error('💥 Critical error fetching users:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error.constructor?.name);
      return [];
    }
  };

  const fetchAllFamilies = async () => {
    try {
      console.log('🏠 Admin: Starting to fetch all families...');
      
      // Check current user auth status
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user for families:', user?.id, user?.email);
      
      if (!user) {
        throw new Error('No authenticated user found for families fetch');
      }

      // Use the new admin-specific function that bypasses RLS
      console.log('🔒 Using admin-specific function to fetch families...');
      const { data, error } = await supabase.rpc('get_all_families_for_admin');
      
      if (error) {
        console.error('❌ Families fetch error:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ Families fetch successful:', data?.length || 0, 'families found');
      console.log('📋 Family data preview:', data?.slice(0, 2));
      
      return data || [];
    } catch (error) {
      console.error('💥 Critical error fetching families:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error.constructor?.name);
      return [];
    }
  };

  const fetchAllChores = async () => {
    try {
      const { data, error } = await supabase
        .from('chores')
        .select(`
          *,
          profiles!assigned_to (display_name),
          families (name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chores:', error);
      return [];
    }
  };

  const fetchProgressLogs = async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .select(`
          *,
          profiles (display_name),
          chores (title),
          families (name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching progress logs:', error);
      return [];
    }
  };

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
  };

  const createBadge = async (badgeData: any) => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .insert(badgeData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating badge:', error);
      throw error;
    }
  };

  const updateBadge = async (badgeId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .update(updates)
        .eq('id', badgeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating badge:', error);
      throw error;
    }
  };

  const deleteBadge = async (badgeId: string) => {
    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', badgeId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting badge:', error);
      throw error;
    }
  };

  const banUser = async (userId: string, reason: string) => {
    try {
      // In a real app, you'd have a banned_users table or add a status field
      // For now, we'll just update the user's profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          // Add custom fields for banned status
          // status: 'banned',
          // ban_reason: reason,
          // banned_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    display_name: string;
    role: 'admin' | 'full_admin' | 'read_only_admin' | 'report_admin' | 'parent' | 'kid';
  }) => {
    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const createTestFamily = async (familyData: {
    familyName: string;
    parentEmail: string;
    parentPassword: string;
    parentName: string;
    children: Array<{
      name: string;
      email: string;
      password: string;
    }>;
  }) => {
    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const { data, error } = await supabase.functions.invoke('create-test-family', {
        body: familyData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error creating test family:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      import('@/utils/secureLogging').then(({ secureLog }) => {
        secureLog.info('Starting user deletion process');
      });
      
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No valid session found');
        throw new Error('No valid session found');
      }

      import('@/utils/secureLogging').then(({ secureLog }) => {
        secureLog.info('Session found, calling edge function...');
      });

      // Use the secure edge function for user deletion
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      import('@/utils/secureLogging').then(({ secureLog }) => {
        secureLog.info('Edge function response received');
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to delete user');
      }

      if (!data?.success) {
        console.error('Edge function returned failure:', data);
        throw new Error(data?.error || 'Failed to delete user');
      }

      import('@/utils/secureLogging').then(({ secureLog }) => {
        secureLog.info('User deleted successfully');
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const deleteFamily = async (familyId: string) => {
    try {
      // Starting family deletion
      
      // Get all family members first
      const { data: familyMembers, error: membersError } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_id', familyId);
      
      if (membersError) {
        console.error('Error fetching family members:', membersError);
        throw membersError;
      }

      // Get family parent
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('parent_id')
        .eq('id', familyId)
        .single();
      
      if (familyError) {
        console.error('Error fetching family:', familyError);
        throw familyError;
      }

      // Collect all user IDs to delete
      const userIds = [...(familyMembers?.map(m => m.user_id) || []), family.parent_id].filter(Boolean);
      // Users to delete identified
      
      // Delete users from profiles first (this should cascade to related data)
      for (const userId of userIds) {
        try {
          // Try auth admin delete first
          const { error: authError } = await supabase.auth.admin.deleteUser(userId);
          if (authError) {
            console.warn(`Auth delete failed for ${userId}, trying profile delete:`, authError);
            // Fallback to profile deletion if auth admin fails
            const { error: profileError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', userId);
            
            if (profileError) {
              console.error(`Profile delete failed for ${userId}:`, profileError);
            } else {
              // Successfully deleted profile
            }
          } else {
            // Successfully deleted auth user
          }
        } catch (error) {
          console.error(`Error deleting user ${userId}:`, error);
        }
      }

      // Delete family members first to avoid foreign key issues
      const { error: deleteMembersError } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId);

      if (deleteMembersError) {
        console.error('Error deleting family members:', deleteMembersError);
      } else {
        // Successfully deleted family members
      }

      // Delete family record last
      const { error: deleteFamilyError } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId);

      if (deleteFamilyError) {
        console.error('Error deleting family record:', deleteFamilyError);
        throw deleteFamilyError;
      } else {
        // Successfully deleted family record
      }
      
      // Family deletion completed successfully
    } catch (error) {
      console.error('Error deleting family:', error);
      throw error;
    }
  };

  const getAnalytics = async () => {
    try {
      // Fetch various analytics data
      const [usersCount, familiesCount, choresCount, completedChoresCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('families').select('id', { count: 'exact', head: true }),
        supabase.from('chores').select('id', { count: 'exact', head: true }),
        supabase.from('chores').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);

      return {
        totalUsers: usersCount.count || 0,
        totalFamilies: familiesCount.count || 0,
        totalChores: choresCount.count || 0,
        completedChores: completedChoresCount.count || 0,
        completionRate: choresCount.count ? ((completedChoresCount.count || 0) / choresCount.count * 100).toFixed(1) : 0,
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        totalUsers: 0,
        totalFamilies: 0,
        totalChores: 0,
        completedChores: 0,
        completionRate: 0,
      };
    }
  };

  return {
    fetchAllUsers,
    fetchAllFamilies,
    fetchAllChores,
    fetchProgressLogs,
    fetchBadges,
    createBadge,
    updateBadge,
    deleteBadge,
    banUser,
    createUser,
    createTestFamily,
    deleteUser,
    deleteFamily,
    getAnalytics,
    loading: isLoading,
  };
}