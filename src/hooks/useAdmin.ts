import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const fetchAllFamilies = async () => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select(`
          *,
          profiles!parent_id (display_name, email),
          family_members (
            profiles (display_name, role)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching families:', error);
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
    role: 'admin' | 'parent' | 'kid';
  }) => {
    try {
      // Use Supabase Admin API to create user with metadata
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData
      });
      
      if (error) throw error;
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
      const { data, error } = await supabase.functions.invoke('create-test-family', {
        body: familyData
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating test family:', error);
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
    getAnalytics,
    loading,
  };
}