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

  const createBulkChores = async (choreData: any, assignedToIds: string[]) => {
    if (!family?.id || !user || assignedToIds.length === 0) return;

    try {
      const choresToInsert = assignedToIds.map(assignedToId => ({
        ...choreData,
        assigned_to: assignedToId,
        family_id: family.id,
        created_by: user.id,
      }));

      const { data, error } = await supabase
        .from('chores')
        .insert(choresToInsert)
        .select();

      if (error) throw error;
      await fetchChores();
      return data;
    } catch (error) {
      console.error('Error creating bulk chores:', error);
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

  const submitChoreForApproval = async (choreId: string) => {
    if (!user) return;

    try {
      // Update chore status to pending approval
      await updateChore(choreId, {
        status: 'pending_approval',
        completed_at: new Date().toISOString(),
      });

      // TODO: Notify parents for approval
    } catch (error) {
      console.error('Error submitting chore for approval:', error);
      throw error;
    }
  };

  const approveChore = async (choreId: string) => {
    if (!user) return;

    try {
      // Find the chore to get points value
      const chore = chores.find(c => c.id === choreId);
      if (!chore) return;

      // Update chore status to completed
      await updateChore(choreId, {
        status: 'completed',
      });

      // Add progress log
      await supabase
        .from('progress_logs')
        .insert({
          user_id: chore.assigned_to,
          chore_id: choreId,
          family_id: family?.id,
          action: 'completed',
          points_earned: chore.points_value,
        });

      // Update user points
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', chore.assigned_to)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            points: (profile.points || 0) + chore.points_value,
          })
          .eq('id', chore.assigned_to);
      }

      // TODO: Notify child of approval

      await fetchChores();
    } catch (error) {
      console.error('Error approving chore:', error);
      throw error;
    }
  };

  const rejectChore = async (choreId: string) => {
    try {
      // Update chore status back to pending
      await updateChore(choreId, {
        status: 'pending',
        completed_at: null,
      });
    } catch (error) {
      console.error('Error rejecting chore:', error);
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
    createBulkChores,
    updateChore,
    submitChoreForApproval,
    approveChore,
    rejectChore,
    refetchChores: fetchChores,
  };
}