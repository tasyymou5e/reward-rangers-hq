-- Phase 3: Fix remaining function and enhance security monitoring

-- Fix the last remaining function with mutable search path
DROP FUNCTION IF EXISTS public.get_user_family_ids(uuid);
CREATE OR REPLACE FUNCTION public.get_user_family_ids(user_id_param uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ARRAY(
    SELECT family_id FROM public.family_members 
    WHERE user_id = user_id_param
  );
$function$;

-- Create enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_violation(
  violation_type text,
  table_name text,
  user_id_param uuid DEFAULT auth.uid(),
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log security violations
  INSERT INTO public.security_alerts (
    user_id,
    alert_type,
    severity,
    description,
    metadata
  ) VALUES (
    user_id_param,
    violation_type,
    'high',
    'Security violation detected on table: ' || table_name || ' - ' || violation_type,
    jsonb_build_object(
      'table_name', table_name,
      'violation_type', violation_type,
      'timestamp', now(),
      'user_role', COALESCE((SELECT role FROM public.profiles WHERE id = user_id_param), 'unknown')
    ) || metadata_param
  );
END;
$function$;

-- Add rate limiting table for authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  email text,
  attempt_count integer DEFAULT 1,
  last_attempt timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate limiting table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limiting data
CREATE POLICY "Admins can manage rate limits" 
ON public.auth_rate_limits 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  ip_addr inet,
  email_addr text DEFAULT NULL,
  max_attempts integer DEFAULT 5,
  block_duration_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_attempts integer;
  blocked_until_time timestamp with time zone;
BEGIN
  -- Clean up old entries
  DELETE FROM public.auth_rate_limits 
  WHERE created_at < now() - interval '1 day';
  
  -- Check if currently blocked
  SELECT blocked_until INTO blocked_until_time
  FROM public.auth_rate_limits
  WHERE ip_address = ip_addr 
    AND (email_addr IS NULL OR email = email_addr)
    AND blocked_until > now()
  ORDER BY last_attempt DESC
  LIMIT 1;
  
  IF blocked_until_time IS NOT NULL THEN
    RETURN false; -- Still blocked
  END IF;
  
  -- Get current attempt count for this IP/email in the last hour
  SELECT COALESCE(attempt_count, 0) INTO current_attempts
  FROM public.auth_rate_limits
  WHERE ip_address = ip_addr 
    AND (email_addr IS NULL OR email = email_addr)
    AND last_attempt > now() - interval '1 hour'
  ORDER BY last_attempt DESC
  LIMIT 1;
  
  current_attempts := COALESCE(current_attempts, 0) + 1;
  
  -- Insert or update rate limit record
  INSERT INTO public.auth_rate_limits (ip_address, email, attempt_count, blocked_until)
  VALUES (
    ip_addr, 
    email_addr, 
    current_attempts,
    CASE WHEN current_attempts >= max_attempts 
         THEN now() + (block_duration_minutes || ' minutes')::interval
         ELSE NULL END
  )
  ON CONFLICT (ip_address, COALESCE(email, ''))
  DO UPDATE SET
    attempt_count = current_attempts,
    last_attempt = now(),
    blocked_until = CASE WHEN current_attempts >= max_attempts 
                         THEN now() + (block_duration_minutes || ' minutes')::interval
                         ELSE auth_rate_limits.blocked_until END;
  
  -- Log security event if blocked
  IF current_attempts >= max_attempts THEN
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      NULL,
      jsonb_build_object(
        'ip_address', ip_addr::text,
        'email', email_addr,
        'attempt_count', current_attempts
      )
    );
    RETURN false;
  END IF;
  
  RETURN true; -- Allow the attempt
END;
$function$;