import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: string;
  description: string;
  metadata: any;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export function useSecurityMonitoring() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSecurityAlerts();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadSecurityAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select(`
          *,
          profiles!security_alerts_user_id_fkey (display_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading security alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts'
        },
        (payload) => {
          setAlerts(prev => [payload.new as SecurityAlert, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const logSecurityEvent = async (eventType: string, metadata: any = {}) => {
    if (!user) return;

    try {
      const clientIP = await getClientIP();
      
      // Enhanced security event logging with rate limiting check
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: {
          user_id: user.id,
          event_type: eventType,
          ip_address: clientIP,
          user_agent: navigator.userAgent,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            session_id: (await supabase.auth.getSession()).data.session?.access_token?.slice(-8),
          },
        },
      });

      if (error) {
        console.error('Security monitoring error:', error);
        
        // Fallback: Log directly to security alerts table
        await supabase.rpc('log_security_event', {
          event_type: eventType,
          user_id_param: user.id,
          metadata_param: {
            ...metadata,
            ip_address: clientIP,
            user_agent: navigator.userAgent,
            fallback_logged: true,
          },
        });
      } else {
        console.log('Security event logged:', data);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
      
      // Final fallback: Log to console for debugging
      console.warn('Security Event (unlogged):', {
        eventType,
        userId: user.id,
        metadata,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const resolveAlert = async (alertId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, resolved: true, resolved_by: user.id, resolved_at: new Date().toISOString() }
            : alert
        )
      );
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  };

  const getUnresolvedAlertsCount = (): number => {
    return alerts.filter(alert => !alert.resolved).length;
  };

  const getAlertsByType = (alertType: string): SecurityAlert[] => {
    return alerts.filter(alert => alert.alert_type === alertType);
  };

  const getAlertsBySeverity = (severity: string): SecurityAlert[] => {
    return alerts.filter(alert => alert.severity === severity);
  };

  return {
    alerts,
    loading,
    logSecurityEvent,
    resolveAlert,
    getUnresolvedAlertsCount,
    getAlertsByType,
    getAlertsBySeverity,
    refreshAlerts: loadSecurityAlerts,
  };
}