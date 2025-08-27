import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Affiliate {
  id: string;
  name: string;
  logo_url?: string;
  base_url: string;
  is_active: boolean;
}

export function useAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAffiliates = async (adminView = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from('approved_affiliates')
        .select('id, name, logo_url, base_url, is_active, api_key_name, created_at, updated_at')
        .order('name');
      
      // For regular users, only show active affiliates
      if (!adminView) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      // Error fetching affiliates (logging removed for production)
      toast({
        title: "Error",
        description: "Failed to load affiliate partners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  return {
    affiliates,
    loading,
    refetchAffiliates: fetchAffiliates,
    fetchAffiliates,
  };
}