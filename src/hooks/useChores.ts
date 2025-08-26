import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from './useFamily';

export function useChores() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [chores, setChores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChores = async () => {
    if (!family?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chores')
        .select(`
          *,
          assigned_to_profile:profiles!assigned_to (*),
          created_by_profile:profiles!created_by (*)
        `)
        .eq('family_id', family.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChores(data || []);
    } catch (error) {
      console.error('Error fetching chores:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChore = async (choreData: any) => {
    if (!family?.id || !user) return;

    try {
      const { data, error } = await supabase
        .from('chores')
        .insert({
          ...choreData,
          family_id: family.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchChores();
      return data;
    } catch (error) {
      console.error('Error creating chore:', error);
      throw error;
    }
  };

  const updateChore = async (choreId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('chores')
        .update(updates)
        .eq('id', choreId);

      if (error) throw error;
      await fetchChores();
    } catch (error) {
      console.error('Error updating chore:', error);
      throw error;
    }
  };

  const completeChore = async (choreId: string) => {
    if (!user) return;

    try {
      // Update chore status
      await updateChore(choreId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      // Find the chore to get points value
      const chore = chores.find(c => c.id === choreId);
      if (chore) {
        // Add progress log
        await supabase
          .from('progress_logs')
          .insert({
            user_id: user.id,
            chore_id: choreId,
            family_id: family?.id,
            action: 'completed',
            points_earned: chore.points_value,
          });

        // Update user points
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              points: (profile.points || 0) + chore.points_value,
            })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error completing chore:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (family?.id) {
      fetchChores();
    }
  }, [family?.id]);

  return {
    chores,
    loading,
    createChore,
    updateChore,
    completeChore,
    refetchChores: fetchChores,
  };
}