import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface ChildProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  points: number;
  level: number;
  streak_days: number;
  last_activity: string;
  created_at: string;
}

interface ChildSettings {
  id: string;
  child_id: string;
  password_policy: any;
  screen_time_limits: any;
  content_restrictions: any;
  communication_settings: any;
  safety_settings: any;
  updated_at: string;
}

interface FamilyJoinRequest {
  id: string;
  family_id: string;
  requester_id: string;
  status: string;
  message?: string;
  created_at: string;
  expires_at: string;
  requester_profile?: {
    display_name: string;
    email: string;
  };
}

export function useChildManagement() {
  const { user } = useAuthStore();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [childSettings, setChildSettings] = useState<Record<string, ChildSettings>>({});
  const [joinRequests, setJoinRequests] = useState<FamilyJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch children in the family
  const fetchChildren = async () => {
    if (!user) return;

    try {
      // Get family ID where user is parent
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id')
        .eq('parent_id', user.id)
        .single();

      if (familyError || !family) {
        setChildren([]);
        return;
      }

      // Get family members who are children
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select(`
          user_id,
          profiles!inner(
            id, username, display_name, email, points, level, 
            streak_days, last_activity, created_at, role
          )
        `)
        .eq('family_id', family.id);

      if (membersError) throw membersError;

      // Filter for child roles
      const childProfiles = members
        ?.filter(member => member.profiles?.role === 'kid')
        .map(member => member.profiles) || [];

      setChildren(childProfiles as ChildProfile[]);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch children');
    }
  };

  // Fetch child settings for all children
  const fetchChildSettings = async () => {
    if (!user || children.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('child_account_settings')
        .select('*')
        .eq('parent_id', user.id);

      if (error) throw error;

      const settingsMap = (data || []).reduce((acc, setting) => {
        acc[setting.child_id] = setting;
        return acc;
      }, {} as Record<string, ChildSettings>);

      setChildSettings(settingsMap);
    } catch (err) {
      console.error('Error fetching child settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch child settings');
    }
  };

  // Fetch family join requests
  const fetchJoinRequests = async () => {
    if (!user) return;

    try {
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id')
        .eq('parent_id', user.id)
        .single();

      if (familyError || !family) return;

      const { data, error } = await supabase
        .from('family_join_requests')
        .select(`
          *,
          profiles!requester_id(display_name, email)
        `)
        .eq('family_id', family.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setJoinRequests(data?.map(req => ({
        ...req,
        requester_profile: req.profiles
      })) || []);
    } catch (err) {
      console.error('Error fetching join requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch join requests');
    }
  };

  // Update child settings
  const updateChildSettings = async (childId: string, settings: Partial<ChildSettings>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('child_account_settings')
        .upsert({
          child_id: childId,
          parent_id: user.id,
          family_id: (await getFamilyId()) || '',
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log the settings change
      await supabase.rpc('log_security_audit', {
        p_action_type: 'child_settings_updated',
        p_resource_type: 'child_settings',
        p_resource_id: childId,
        p_risk_level: 'low',
        p_metadata: { updated_fields: Object.keys(settings) }
      });

      await fetchChildSettings();
    } catch (err) {
      console.error('Error updating child settings:', err);
      throw err;
    }
  };

  // Reset child password
  const resetChildPassword = async (childId: string, newPassword: string) => {
    if (!user) return;

    try {
      // Call edge function to reset password
      const { error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          userId: childId,
          updates: { password: newPassword },
          adminAction: 'password_reset'
        }
      });

      if (error) throw error;

      // Log the password reset
      await supabase.rpc('log_security_audit', {
        p_action_type: 'child_password_reset',
        p_resource_type: 'child_account',
        p_resource_id: childId,
        p_risk_level: 'medium',
        p_metadata: { reset_by_parent: true }
      });
    } catch (err) {
      console.error('Error resetting child password:', err);
      throw err;
    }
  };

  // Process family join request
  const processJoinRequest = async (requestId: string, action: 'approve' | 'reject', message?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('family_join_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          approved_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, add user to family
      if (action === 'approve') {
        const request = joinRequests.find(r => r.id === requestId);
        if (request) {
          const familyId = await getFamilyId();
          if (familyId) {
            await supabase
              .from('family_members')
              .insert({
                family_id: familyId,
                user_id: request.requester_id
              });
          }
        }
      }

      // Log the request processing
      await supabase.rpc('log_security_audit', {
        p_action_type: 'join_request_processed',
        p_resource_type: 'family_join_request',
        p_resource_id: requestId,
        p_risk_level: 'low',
        p_metadata: { action, message }
      });

      await fetchJoinRequests();
    } catch (err) {
      console.error('Error processing join request:', err);
      throw err;
    }
  };

  // Helper function to get family ID
  const getFamilyId = async () => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('families')
      .select('id')
      .eq('parent_id', user.id)
      .single();
    
    return data?.id || null;
  };

  useEffect(() => {
    const initialize = async () => {
      if (user) {
        setLoading(true);
        await Promise.all([
          fetchChildren(),
          fetchJoinRequests()
        ]);
        setLoading(false);
      }
    };

    initialize();
  }, [user]);

  useEffect(() => {
    if (children.length > 0) {
      fetchChildSettings();
    }
  }, [children]);

  return {
    children,
    childSettings,
    joinRequests,
    loading,
    error,
    updateChildSettings,
    resetChildPassword,
    processJoinRequest,
    refreshData: () => {
      fetchChildren();
      fetchJoinRequests();
      fetchChildSettings();
    }
  };
}