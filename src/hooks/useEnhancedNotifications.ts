import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EnhancedNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data: any;
  family_id?: string;
  consolidated: boolean;
  routing_info: any;
  created_at: string;
  updated_at: string;
}

export function useEnhancedNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
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
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createConsolidatedNotification = useCallback(async (
    familyId: string,
    title: string,
    message: string,
    type: string = 'info',
    data?: Record<string, any>
  ) => {
    try {
      // For now, create notification directly until function is available
      const { data: insertResult, error } = await supabase
        .from('notifications')
        .insert({
          user_id: familyId, // This would be determined by routing logic
          family_id: familyId,
          title,
          message,
          type,
          data: data || {},
          consolidated: true,
          routing_info: { type: 'consolidated' },
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh notifications if it affects current user
      await fetchNotifications();
      
      return insertResult.id;
    } catch (error) {
      console.error('Error creating consolidated notification:', error);
      throw error;
    }
  }, [fetchNotifications]);

  const createDirectNotification = useCallback(async (
    userId: string,
    title: string,
    message: string,
    type: string = 'info',
    data?: Record<string, any>,
    familyId?: string
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
          family_id: familyId,
          consolidated: false,
          routing_info: { type: 'direct' },
        });

      if (error) throw error;
      
      // Refresh notifications if it's for current user
      if (userId === user?.id) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error creating direct notification:', error);
      throw error;
    }
  }, [user?.id, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
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
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
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
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
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
  }, [user?.id]);

  // Enhanced notification utility functions
  const notifyChoreApproval = useCallback(async (
    familyId: string,
    childId: string,
    choreName: string,
    pointsEarned: number
  ) => {
    await createConsolidatedNotification(
      familyId,
      'Chore Approved! 🎉',
      `Chore "${choreName}" has been approved! ${pointsEarned} XP earned!`,
      'chore_approved',
      { choreName, pointsEarned, childId }
    );
  }, [createConsolidatedNotification]);

  const notifyParentChoreCompletion = useCallback(async (
    familyId: string,
    childName: string,
    choreName: string
  ) => {
    await createConsolidatedNotification(
      familyId,
      'Chore Ready for Approval',
      `${childName} has completed "${choreName}" and is waiting for your approval.`,
      'chore_completion',
      { childName, choreName }
    );
  }, [createConsolidatedNotification]);

  const notifyWishlistApproval = useCallback(async (
    familyId: string,
    childId: string,
    itemName: string
  ) => {
    await createConsolidatedNotification(
      familyId,
      'Wish Approved! ✨',
      `Wishlist item "${itemName}" has been approved!`,
      'wishlist_approved',
      { itemName, childId }
    );
  }, [createConsolidatedNotification]);

  const notifyFamilyAnnouncement = useCallback(async (
    familyId: string,
    title: string,
    message: string
  ) => {
    await createConsolidatedNotification(
      familyId,
      title,
      message,
      'family_announcement'
    );
  }, [createConsolidatedNotification]);

  const notifyAchievementUnlocked = useCallback(async (
    familyId: string,
    childId: string,
    achievementName: string
  ) => {
    await createConsolidatedNotification(
      familyId,
      'New Achievement Unlocked! 🏆',
      `${achievementName} achievement has been unlocked!`,
      'achievement_unlocked',
      { achievementName, childId }
    );
  }, [createConsolidatedNotification]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('enhanced_user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as EnhancedNotification;
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
  }, [user, fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    
    // Core functions
    createConsolidatedNotification,
    createDirectNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetchNotifications: fetchNotifications,
    
    // Enhanced utility functions
    notifyChoreApproval,
    notifyParentChoreCompletion,
    notifyWishlistApproval,
    notifyFamilyAnnouncement,
    notifyAchievementUnlocked,
  };
}