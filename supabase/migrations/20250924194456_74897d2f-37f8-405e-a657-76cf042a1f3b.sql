-- Fix function naming conflict and complete security fixes
-- Drop and recreate the validate_family_code_secure function with proper signature

DROP FUNCTION IF EXISTS public.validate_family_code_secure(text);

CREATE OR REPLACE FUNCTION public.validate_family_code_secure(code_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Basic format validation without exposing actual codes
  -- Family codes should be 8 characters, alphanumeric
  IF length(code_input) != 8 THEN
    RETURN false;
  END IF;
  
  -- Check if contains only alphanumeric characters
  IF code_input !~ '^[a-zA-Z0-9]+$' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- Complete security fixes by updating remaining functions
CREATE OR REPLACE FUNCTION public.log_security_event_with_rate_limit(event_type text, user_id_param uuid, metadata_param jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check rate limit (max 100 events per minute per user)
  IF NOT public.check_rate_limit_enhanced(event_type, 100, 10000) THEN
    -- Rate limit exceeded, create alert but don't block the function
    INSERT INTO public.security_alerts (
      user_id,
      alert_type,
      severity,
      description,
      metadata
    ) VALUES (
      user_id_param,
      'rate_limit_exceeded',
      'medium',
      'Rate limit exceeded for security event logging',
      jsonb_build_object(
        'event_type', event_type,
        'timestamp', now(),
        'user_id', user_id_param
      )
    );
    RETURN; -- Exit early to prevent spam
  END IF;
  
  -- Log the security event
  PERFORM public.log_security_event(event_type, user_id_param, metadata_param);
END;
$function$;

-- Create comprehensive security monitoring edge function
CREATE OR REPLACE FUNCTION public.run_security_monitoring()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  monitoring_results jsonb;
  alert_count integer;
  critical_alerts integer;
  rate_limit_violations integer;
BEGIN
  -- Only allow admins to run security monitoring
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Run security violation detection
  PERFORM public.detect_security_violations();
  
  -- Get current alert metrics
  SELECT COUNT(*) INTO alert_count
  FROM public.security_alerts
  WHERE created_at > now() - interval '24 hours'
    AND resolved = false;
    
  SELECT COUNT(*) INTO critical_alerts
  FROM public.security_alerts
  WHERE created_at > now() - interval '24 hours'
    AND resolved = false
    AND severity = 'critical';
    
  SELECT COUNT(*) INTO rate_limit_violations
  FROM public.auth_rate_limits
  WHERE last_attempt > now() - interval '24 hours'
    AND attempt_count >= 5;
  
  -- Create comprehensive monitoring summary
  monitoring_results := jsonb_build_object(
    'monitoring_time', now(),
    'active_alerts_24h', alert_count,
    'critical_alerts_24h', critical_alerts,
    'rate_limit_violations_24h', rate_limit_violations,
    'security_status', CASE 
      WHEN critical_alerts > 0 THEN 'critical'
      WHEN alert_count > 10 THEN 'high_risk'
      WHEN alert_count > 5 THEN 'elevated'
      WHEN alert_count > 0 THEN 'monitoring'
      ELSE 'secure'
    END,
    'recommendations', CASE
      WHEN critical_alerts > 0 THEN jsonb_build_array('immediate_action_required', 'review_critical_alerts')
      WHEN rate_limit_violations > 20 THEN jsonb_build_array('review_rate_limits', 'check_for_attacks')
      WHEN alert_count > 5 THEN jsonb_build_array('review_security_alerts', 'monitor_closely')
      ELSE jsonb_build_array('maintain_current_monitoring')
    END,
    'last_scan_by', auth.uid()
  );
  
  -- Log monitoring activity
  PERFORM public.log_security_event(
    'comprehensive_security_monitoring',
    auth.uid(),
    monitoring_results
  );
  
  RETURN monitoring_results;
END;
$function$;