import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useFamily() {
  const { user, profile } = useAuth();
  const [family, setFamily] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFamily = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First, check if user is a parent with their own family
      if (profile?.role === 'parent') {
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .select('*')
          .eq('parent_id', user.id)
          .single();

        if (familyData) {
          setFamily(familyData);
          await fetchFamilyMembers(familyData.id);
          return;
        }
      }

      // If not a parent or no family found, check if they're a member of a family
      const { data: membershipData, error: membershipError } = await supabase
        .from('family_members')
        .select(`
          family_id,
          families (*)
        `)
        .eq('user_id', user.id)
        .single();

      if (membershipData) {
        setFamily(membershipData.families);
        await fetchFamilyMembers(membershipData.family_id);
      }
    } catch (error) {
      console.error('Error fetching family:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          profiles (*)
        `)
        .eq('family_id', familyId);

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  const createFamily = async (familyName: string) => {
    if (!user || profile?.role !== 'parent') return;

    try {
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName,
          parent_id: user.id,
        })
        .select()
        .single();

      if (familyError) throw familyError;

      // Add parent as family member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      setFamily(familyData);
      await fetchFamilyMembers(familyData.id);
      return familyData;
    } catch (error) {
      console.error('Error creating family:', error);
      throw error;
    }
  };

  const joinFamily = async (familyCode: string) => {
    if (!user) return;

    try {
      // SECURITY FIX: Use secure function to join family without exposing family codes
      const { data: result, error } = await supabase.rpc('join_family_with_code_secure', {
        family_code_input: familyCode
      });

      if (error) throw error;

      // Parse the secure function response - result is a jsonb object
      const familyResult = result as any;
      const familyData = {
        id: familyResult.family_id,
        name: familyResult.family_name
      };

      setFamily(familyData);
      await fetchFamilyMembers(familyResult.family_id);
      return familyData;
    } catch (error) {
      console.error('Error joining family securely:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchFamily();
    }
  }, [user, profile]);

  return {
    family,
    familyMembers,
    loading,
    createFamily,
    joinFamily,
    refetchFamily: fetchFamily,
  };
}