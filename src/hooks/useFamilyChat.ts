import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from './useFamily';

export function useFamilyChat() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!family?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_messages')
        .select(`
          *,
          user_profile:profiles!user_id (display_name, avatar_url)
        `)
        .eq('family_id', family.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, type: 'chat' | 'note' | 'announcement' = 'chat', choreId?: string) => {
    if (!family?.id || !user) return;

    try {
      const { data, error } = await supabase
        .from('family_messages')
        .insert({
          family_id: family.id,
          user_id: user.id,
          content,
          message_type: type,
          chore_id: choreId,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchMessages();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (family?.id) {
      fetchMessages();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('family_messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'family_messages',
            filter: `family_id=eq.${family.id}`
          }, 
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [family?.id]);

  return {
    messages,
    loading,
    sendMessage,
    refetchMessages: fetchMessages,
  };
}