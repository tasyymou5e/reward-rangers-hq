import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChildAccount {
  id: string;
  username: string;
  display_name: string;
  email: string;
  role: string;
  points: number;
  level: number;
  streak_days: number;
  avatar_url?: string;
  created_at: string;
  last_activity?: string;
}

interface ChildAccountSettings {
  id: string;
  child_id: string;
  parent_id: string;
  family_id: string;
  password_policy: {
    min_length: number;
    require_parent_approval: boolean;
  } | any;
  screen_time_limits: any;
  content_restrictions: any;
  communication_settings: {
    allow_family_chat: boolean;
    moderated: boolean;
  } | any;
  safety_settings: {
    share_activity_with_parent: boolean;
  } | any;
  created_at: string;
  updated_at: string;
}

interface FamilyJoinRequest {
  id: string;
  family_id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  approved_by?: string;
  processed_at?: string;
  expires_at: string;
  created_at: string;
}

export function useParentChildManagement() {
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [childSettings, setChildSettings] = useState<ChildAccountSettings[]>([]);
  const [joinRequests, setJoinRequests] = useState<FamilyJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Child account management
  const inviteChild = async (childName: string, childPassword: string, familyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-child', {
        body: {
          childName,
          childPassword,
          familyId
        }
      });

      if (error) throw error;
      
      // Refresh children list
      await loadChildren();
      
      return { success: true, data };
    } catch (err) {
      console.error('Failed to invite child:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to invite child' 
      };
    }
  };

  const resetChildPassword = async (childId: string, newPassword: string) => {
    try {
      // Use admin function to reset password
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          userId: childId,
          updates: { password: newPassword }
        }
      });

      if (error) throw error;

      // Log security event
      await supabase.rpc('log_security_audit', {
        p_action_type: 'child_password_reset',
        p_resource_type: 'child_account',
        p_resource_id: childId,
        p_risk_level: 'medium',
        p_metadata: { reset_by_parent: true }
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to reset child password:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to reset password' 
      };
    }
  };

  const updateChildSettings = async (
    childId: string, 
    settings: Partial<ChildAccountSettings>
  ) => {
    try {
      // Get family_id from family_members table
      const user = await supabase.auth.getUser();
      const { data: familyData } = await supabase
        .from('families')
        .select('id')
        .eq('parent_id', user.data.user?.id)
        .single();

      const { error } = await supabase
        .from('child_account_settings')
        .upsert({
          child_id: childId,
          parent_id: user.data.user?.id!,
          family_id: familyData?.id!,
          ...settings
        });

      if (error) throw error;
      
      await loadChildSettings();
      return { success: true };
    } catch (err) {
      console.error('Failed to update child settings:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update settings' 
      };
    }
  };

  const getChildActivity = async (childId: string, days = 7) => {
    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .select(`
          *,
          chores(title, points_value)
        `)
        .eq('user_id', childId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Failed to get child activity:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to load activity' 
      };
    }
  };

  // Family join request management
  const approveJoinRequest = async (requestId: string) => {
    try {
      const { data: request, error: fetchError } = await supabase
        .from('family_join_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Add user to family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: request.family_id,
          user_id: request.requester_id
        });

      if (memberError) throw memberError;

      // Update request status
      const { error: updateError } = await supabase
        .from('family_join_requests')
        .update({
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      await loadJoinRequests();
      return { success: true };
    } catch (err) {
      console.error('Failed to approve join request:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to approve request' 
      };
    }
  };

  const rejectJoinRequest = async (requestId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('family_join_requests')
        .update({
          status: 'rejected',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          processed_at: new Date().toISOString(),
          metadata: { rejection_reason: reason }
        })
        .eq('id', requestId);

      if (error) throw error;
      
      await loadJoinRequests();
      return { success: true };
    } catch (err) {
      console.error('Failed to reject join request:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to reject request' 
      };
    }
  };

  // Data loading
  const loadChildren = async () => {
    try {
      // Get current user's family
      const { data: families, error: familyError } = await supabase
        .from('families')
        .select('id')
        .eq('parent_id', (await supabase.auth.getUser()).data.user?.id);

      if (familyError) throw familyError;
      if (!families || families.length === 0) {
        setChildren([]);
        return;
      }

      // Get family members who are children
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          user_id,
          profiles!inner(
            id,
            username,
            display_name,
            email,
            role,
            points,
            level,
            streak_days,
            avatar_url,
            created_at,
            last_activity
          )
        `)
        .eq('family_id', families[0].id)
        .eq('profiles.role', 'kid');

      if (error) throw error;
      
      const childrenData = data?.map(item => item.profiles).filter(Boolean) || [];
      setChildren(childrenData as ChildAccount[]);
    } catch (err) {
      console.error('Failed to load children:', err);
      setError(err instanceof Error ? err.message : 'Failed to load children');
    }
  };

  const loadChildSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('child_account_settings')
        .select('*')
        .eq('parent_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      setChildSettings((data || []).map(setting => ({
        ...setting,
        password_policy: setting.password_policy as any,
        communication_settings: setting.communication_settings as any,
        safety_settings: setting.safety_settings as any,
      })));
    } catch (err) {
      console.error('Failed to load child settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load child settings');
    }
  };

  const loadJoinRequests = async () => {
    try {
      // Get family IDs where user is parent
      const { data: families, error: familyError } = await supabase
        .from('families')
        .select('id')
        .eq('parent_id', (await supabase.auth.getUser()).data.user?.id);

      if (familyError) throw familyError;
      if (!families || families.length === 0) {
        setJoinRequests([]);
        return;
      }

      const { data, error } = await supabase
        .from('family_join_requests')
        .select(`
          *,
          profiles!inner(display_name, email)
        `)
        .in('family_id', families.map(f => f.id))
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJoinRequests((data || []).map(request => ({
        ...request,
        status: request.status as 'pending' | 'approved' | 'rejected',
      })));
    } catch (err) {
      console.error('Failed to load join requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load join requests');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadChildren(),
          loadChildSettings(),
          loadJoinRequests()
        ]);
      } catch (err) {
        console.error('Failed to load parent data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    // State
    children,
    childSettings,
    joinRequests,
    loading,
    error,
    
    // Child management
    inviteChild,
    resetChildPassword,
    updateChildSettings,
    getChildActivity,
    
    // Join request management
    approveJoinRequest,
    rejectJoinRequest,
    
    // Data loading
    loadChildren,
    loadChildSettings,
    loadJoinRequests
  };
}