import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Enhanced secure notifications hook with comprehensive logging
 * and authorization checks
 */
export function useSecureNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logNotificationAccess = async (action: string, metadata: any = {}) => {
    try {
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: `notification_${action}`,
        user_id_param: user?.id || null,
        metadata_param: {
          action,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      });
    } catch (err) {
      // Silently handle logging errors to avoid breaking notification flow
      console.error('Notification security logging error:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Log access attempt
      await logNotificationAccess('fetch_attempt', {
        user_id: user.id
      });

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setNotifications(data || []);
      
      // Log successful fetch
      await logNotificationAccess('fetch_success', {
        count: (data || []).length,
        unread_count: (data || []).filter(n => !n.read).length
      });

    } catch (err) {
      console.error('Error fetching secure notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      
      // Log failed fetch
      await logNotificationAccess('fetch_failed', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      // Verify notification belongs to user before updating
      const { data: verifyData, error: verifyError } = await supabase
        .from('notifications')
        .select('user_id')
        .eq('id', notificationId)
        .single();

      if (verifyError || verifyData?.user_id !== user.id) {
        throw new Error('Unauthorized: Cannot access this notification');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', user.id); // Double-check authorization

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );

      // Log successful mark as read
      await logNotificationAccess('mark_read_success', {
        notification_id: notificationId
      });

    } catch (err) {
      console.error('Error marking notification as read:', err);
      
      // Log failed mark as read
      await logNotificationAccess('mark_read_failed', {
        notification_id: notificationId,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      // Log successful mark all as read
      await logNotificationAccess('mark_all_read_success', {
        user_id: user.id
      });

    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      
      // Log failed mark all as read
      await logNotificationAccess('mark_all_read_failed', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  return {
    notifications,
    loading,
    error,
    unreadCount: getUnreadCount(),
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
}