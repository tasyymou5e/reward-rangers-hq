import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Secure hook for accessing profile data with mandatory email masking
 * and comprehensive security logging
 */
interface SecureProfile {
  id: string;
  username: string;
  display_name: string;
  email_masked: string;
  role: string;
  points: number;
  level: number;
  streak_days: number;
  avatar_url: string | null;
  created_at: string;
  last_activity: string | null;
}

export function useSecureProfiles() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<SecureProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_profiles_secure', {
        requesting_user_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching secure profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const getProfileById = async (targetUserId: string): Promise<SecureProfile | null> => {
    if (!user) return null;

    try {
      const { data, error: rpcError } = await supabase.rpc('get_profile_by_id_secure', {
        target_user_id: targetUserId,
        requesting_user_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      return data?.[0] || null;
    } catch (err) {
      console.error('Error fetching profile by ID:', err);
      return null;
    }
  };

  const updateEmail = async (newEmail: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: rpcError } = await supabase.rpc('update_profile_email_secure', {
        new_email: newEmail
      });

      if (rpcError) {
        throw rpcError;
      }

      // Refresh profiles to get updated data
      await fetchProfiles();
      return true;
    } catch (err) {
      console.error('Error updating email:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  return {
    profiles,
    loading,
    error,
    refreshProfiles: fetchProfiles,
    getProfileById,
    updateEmail
  };
}