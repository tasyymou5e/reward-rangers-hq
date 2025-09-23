import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/hooks/useFamily';
import { useToast } from '@/hooks/use-toast';

interface FamilyMessage {
  id: string;
  family_id: string;
  user_id: string;
  content: string;
  message_type: string;
  chore_id?: string;
  parent_message_id?: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: any;
}

export function useFamilyChat() {
  const { user } = useAuth();
  const { family } = useFamily();
  const { toast } = useToast();
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!user || !family?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_messages')
        .select(`
          *,
          user_profile:profiles!user_id (
            display_name,
            username
          )
        `)
        .eq('family_id', family.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as any);
    } catch (error) {
      console.error('Error fetching family messages:', error);
      toast({
        title: "Error",
        description: "Failed to load family messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    content: string, 
    messageType: 'chat' | 'note' | 'announcement' = 'chat',
    choreId?: string,
    parentMessageId?: string
  ) => {
    if (!user || !family?.id || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('family_messages')
        .insert({
          family_id: family.id,
          user_id: user.id,
          content: content.trim(),
          message_type: messageType,
          chore_id: choreId,
          parent_message_id: parentMessageId,
          is_encrypted: true, // Messages are encrypted by default
        });

      if (error) throw error;

      // Refresh messages
      await fetchMessages();

      toast({
        title: "Message Sent",
        description: `Your ${messageType} has been sent to the family.`,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      throw error;
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    // TODO: Implement read status tracking
    console.log('Mark message as read:', messageId);
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!family?.id) return;

    const subscription = supabase
      .channel('family_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_messages',
          filter: `family_id=eq.${family.id}`,
        },
        () => {
          fetchMessages(); // Refresh messages on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [family?.id]);

  useEffect(() => {
    if (user && family?.id) {
      fetchMessages();
    }
  }, [user, family?.id]);

  return {
    messages,
    loading,
    sendMessage,
    markMessageAsRead,
    refetchMessages: fetchMessages,
  };
}