-- Add enhanced security logging for email system
CREATE OR REPLACE FUNCTION public.log_security_event_with_rate_limit(
  event_type text,
  user_id_param uuid DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'::jsonb,
  rate_limit_window_seconds integer DEFAULT 60,
  max_events_per_window integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_count integer;
  client_ip inet;
BEGIN
  client_ip := inet_client_addr();
  
  -- Check rate limiting for this event type from this IP/user
  SELECT COUNT(*) INTO event_count
  FROM security_alerts
  WHERE alert_type = event_type
    AND (user_id = user_id_param OR (user_id IS NULL AND metadata->>'ip_address' = client_ip::text))
    AND created_at > now() - (rate_limit_window_seconds || ' seconds')::interval;
  
  IF event_count >= max_events_per_window THEN
    -- Rate limit exceeded, log the rate limit event instead
    INSERT INTO security_alerts (
      user_id, alert_type, severity, description, metadata
    ) VALUES (
      user_id_param,
      'rate_limit_exceeded_' || event_type,
      'high',
      'Rate limit exceeded for security event type: ' || event_type,
      jsonb_build_object(
        'original_event_type', event_type,
        'event_count', event_count,
        'rate_limit_window', rate_limit_window_seconds,
        'max_events', max_events_per_window,
        'ip_address', client_ip::text,
        'timestamp', now()
      ) || metadata_param
    );
    RETURN;
  END IF;
  
  -- Log the event
  INSERT INTO security_alerts (
    user_id, alert_type, severity, description, metadata
  ) VALUES (
    user_id_param,
    event_type,
    CASE 
      WHEN event_type ILIKE '%failed%' OR event_type ILIKE '%error%' THEN 'medium'
      WHEN event_type ILIKE '%critical%' OR event_type ILIKE '%blocked%' THEN 'high'
      ELSE 'low'
    END,
    'Security event: ' || event_type,
    jsonb_build_object(
      'ip_address', client_ip::text,
      'user_agent', current_setting('request.headers', true)::json->>'user-agent',
      'timestamp', now()
    ) || metadata_param
  );
END;
$$;

-- Enhanced email routing monitoring function
CREATE OR REPLACE FUNCTION public.monitor_email_routing_security()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_families integer;
  migrated_families integer;
  recent_resolutions integer;
  suspicious_activity integer;
BEGIN
  -- Only allow admins to run this monitoring
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Get family migration statistics
  SELECT COUNT(*) INTO total_families FROM families;
  SELECT COUNT(*) INTO migrated_families 
  FROM families 
  WHERE primary_email_designator IS NOT NULL;
  
  -- Get recent email resolution activity (last 24h)
  SELECT COUNT(*) INTO recent_resolutions
  FROM security_alerts
  WHERE alert_type ILIKE '%email%resolution%'
    AND created_at > now() - interval '24 hours';
  
  -- Check for suspicious email activity
  SELECT COUNT(*) INTO suspicious_activity
  FROM security_alerts
  WHERE alert_type ILIKE '%email%'
    AND severity IN ('high', 'critical')
    AND resolved = false
    AND created_at > now() - interval '24 hours';
  
  result := jsonb_build_object(
    'monitoring_timestamp', now(),
    'total_families', total_families,
    'migrated_families', migrated_families,
    'migration_percentage', 
      CASE WHEN total_families > 0 
           THEN ROUND((migrated_families::numeric / total_families) * 100, 2)
           ELSE 0 END,
    'recent_resolutions_24h', recent_resolutions,
    'suspicious_activity_24h', suspicious_activity,
    'security_status', 
      CASE 
        WHEN suspicious_activity > 5 THEN 'critical'
        WHEN suspicious_activity > 2 THEN 'elevated'
        WHEN suspicious_activity > 0 THEN 'monitoring'
        ELSE 'secure'
      END,
    'recommendations', 
      CASE
        WHEN migrated_families < total_families THEN 
          jsonb_build_array('complete_family_migration', 'monitor_legacy_auth')
        WHEN suspicious_activity > 0 THEN
          jsonb_build_array('investigate_alerts', 'review_security_logs')
        ELSE
          jsonb_build_array('maintain_monitoring')
      END
  );
  
  -- Log monitoring activity
  PERFORM log_security_event_with_rate_limit(
    'email_routing_security_monitoring',
    auth.uid(),
    result
  );
  
  RETURN result;
END;
$$;