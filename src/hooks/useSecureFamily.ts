import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Secure hook for accessing family data with enhanced logging
 * and access validation
 */
interface SecureFamily {
  id: string;
  name: string;
  family_code: string;
  parent_id: string;
  created_at: string;
  updated_at: string;
}

export function useSecureFamily(familyId?: string) {
  const { user } = useAuth();
  const [family, setFamily] = useState<SecureFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilyData = async (targetFamilyId?: string) => {
    if (!user || !targetFamilyId) {
      setFamily(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_family_data_secure', {
        family_id_param: targetFamilyId,
        requesting_user_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      setFamily(data?.[0] || null);
    } catch (err) {
      console.error('Error fetching secure family data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch family data');
      setFamily(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (familyId) {
      fetchFamilyData(familyId);
    }
  }, [user, familyId]);

  return {
    family,
    loading,
    error,
    refreshFamily: () => fetchFamilyData(familyId)
  };
}