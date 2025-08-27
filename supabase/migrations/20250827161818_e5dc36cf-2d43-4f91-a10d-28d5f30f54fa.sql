-- Phase 1C: Restrict security alerts and add rate limiting
DROP POLICY IF EXISTS "System can create security alerts" ON public.security_alerts;

CREATE POLICY "Controlled security alert creation" 
ON public.security_alerts 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Add rate limiting for security events
CREATE OR REPLACE FUNCTION public.log_security_event_with_rate_limit(
  event_type text, 
  user_id_param uuid, 
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_events_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_events_count
  FROM public.security_alerts
  WHERE user_id = user_id_param
    AND alert_type = event_type
    AND created_at > now() - interval '1 minute';
    
  IF recent_events_count >= 10 THEN
    IF recent_events_count = 10 THEN
      INSERT INTO public.security_alerts (
        user_id,
        alert_type,
        severity,
        description,
        metadata
      ) VALUES (
        user_id_param,
        'security_event_rate_limit_exceeded',
        'high',
        'Security event rate limit exceeded for: ' || event_type,
        jsonb_build_object(
          'original_event_type', event_type,
          'rate_limit_threshold', 10,
          'time_window', '1 minute'
        )
      );
    END IF;
    RETURN;
  END IF;
  
  PERFORM public.log_security_event(event_type, user_id_param, metadata_param);
END;
$function$