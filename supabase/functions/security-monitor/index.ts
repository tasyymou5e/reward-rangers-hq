import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityEvent {
  user_id: string;
  event_type: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const detectSuspiciousActivity = async (event: SecurityEvent): Promise<boolean> => {
  const { user_id, event_type, ip_address } = event;
  
  // Check for multiple failed logins in last 15 minutes
  if (event_type === 'failed_login') {
    const { count } = await supabase
      .from('security_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('alert_type', 'failed_login_attempts')
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());
    
    if ((count || 0) >= 3) {
      return true;
    }
  }

  // Check for logins from different countries within short timeframe
  if (event_type === 'login' && ip_address) {
    const { data: recentLogins } = await supabase
      .from('security_alerts')
      .select('metadata')
      .eq('user_id', user_id)
      .eq('alert_type', 'unusual_location')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(5);

    // Simplified location check - in real app, use IP geolocation service
    if (recentLogins && recentLogins.length > 0) {
      const locations = recentLogins.map(login => login.metadata?.ip_address);
      if (locations.some(loc => loc !== ip_address)) {
        return true;
      }
    }
  }

  // Check for unusual activity patterns (simplified)
  if (event_type === 'bulk_actions') {
    const { count } = await supabase
      .from('progress_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    
    if ((count || 0) > 20) { // More than 20 actions in 5 minutes
      return true;
    }
  }

  return false;
};

const createSecurityAlert = async (event: SecurityEvent, alertType: string, severity: string = 'medium') => {
  const { user_id, event_type, ip_address, user_agent, metadata } = event;
  
  const alertData = {
    user_id,
    alert_type: alertType,
    severity,
    description: getAlertDescription(alertType, event_type),
    metadata: {
      event_type,
      ip_address,
      user_agent,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };

  const { error } = await supabase
    .from('security_alerts')
    .insert(alertData);

  if (error) {
    console.error('Failed to create security alert:', error);
  } else {
    console.log(`Security alert created: ${alertType} for user ${user_id}`);
  }
};

const getAlertDescription = (alertType: string, eventType: string): string => {
  switch (alertType) {
    case 'failed_login_attempts':
      return 'Multiple failed login attempts detected within 15 minutes';
    case 'unusual_location':
      return 'Login detected from unusual location';
    case 'bulk_actions':
      return 'Unusual high-frequency activity detected';
    case 'suspicious_behavior':
      return `Suspicious ${eventType} behavior detected`;
    default:
      return 'Security event flagged for review';
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const event: SecurityEvent = await req.json();
    
    console.log('Processing security event:', event);
    
    const isSuspicious = await detectSuspiciousActivity(event);
    
    if (isSuspicious) {
      let alertType = 'suspicious_behavior';
      let severity = 'medium';
      
      if (event.event_type === 'failed_login') {
        alertType = 'failed_login_attempts';
        severity = 'high';
      } else if (event.event_type === 'login') {
        alertType = 'unusual_location';
        severity = 'medium';
      } else if (event.event_type === 'bulk_actions') {
        alertType = 'bulk_actions';
        severity = 'high';
      }
      
      await createSecurityAlert(event, alertType, severity);
      
      return new Response(
        JSON.stringify({ 
          alert_created: true, 
          alert_type: alertType,
          severity 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ alert_created: false, message: 'No suspicious activity detected' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in security monitor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);