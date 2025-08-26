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

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('approved_affiliates')
        .select('id, name, logo_url, base_url, is_active')
        .eq('is_active', true)
        .order('name');

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
  };
}