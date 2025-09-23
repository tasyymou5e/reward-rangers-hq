import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data?: any;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const notificationData = data || [];
      setNotifications(notificationData as any);
      setUnreadCount(notificationData.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: string = 'info',
    data?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data: data || {},
        });

      if (error) throw error;
      
      // Refresh notifications if it's for current user
      if (userId === user?.id) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  // Notification utility functions for specific use cases
  const notifyChoreApproval = async (childId: string, choreName: string, pointsEarned: number) => {
    await createNotification(
      childId,
      'Chore Approved! 🎉',
      `Your chore "${choreName}" has been approved! You earned ${pointsEarned} XP!`,
      'chore_approved',
      { choreName, pointsEarned }
    );
  };

  const notifyParentChoreCompletion = async (parentId: string, childName: string, choreName: string) => {
    await createNotification(
      parentId,
      'Chore Ready for Approval',
      `${childName} has completed "${choreName}" and is waiting for your approval.`,
      'chore_approval',
      { childName, choreName }
    );
  };

  const notifyWishlistApproval = async (childId: string, itemName: string) => {
    await createNotification(
      childId,
      'Wish Approved! ✨',
      `Your wishlist item "${itemName}" has been approved by your parent!`,
      'wishlist_approved',
      { itemName }
    );
  };

  const notifyFamilyAnnouncement = async (userIds: string[], title: string, message: string) => {
    const promises = userIds.map(userId => 
      createNotification(userId, title, message, 'family_announcement')
    );
    await Promise.all(promises);
  };

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notifications
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  return {
    notifications,
    loading,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetchNotifications: fetchNotifications,
    // Utility functions
    notifyChoreApproval,
    notifyParentChoreCompletion,
    notifyWishlistApproval,
    notifyFamilyAnnouncement,
  };
}