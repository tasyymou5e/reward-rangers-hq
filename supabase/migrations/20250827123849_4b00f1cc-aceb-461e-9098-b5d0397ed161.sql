-- Phase 1: Database Security Hardening

-- Fix search_path exposure in all SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.encrypt_mfa_secret(secret_text text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- For now, use simple base64 encoding until encryption key is configured
  SELECT encode(secret_text::bytea, 'base64');
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_mfa_secret(encoded_text text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- For now, use simple base64 decoding until encryption key is configured
  SELECT decode(encoded_text, 'base64')::text;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'parent')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_user_to_ab_tests()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.ab_test_assignments (test_id, user_id, variant)
  SELECT 
    ab_tests.id,
    NEW.id,
    (ab_tests.variants->0->>'name')::TEXT
  FROM public.ab_tests
  WHERE ab_tests.active = true
    AND ab_tests.start_date <= now()
    AND (ab_tests.end_date IS NULL OR ab_tests.end_date > now())
  ON CONFLICT (test_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
$function$;

-- Secure affiliate data access - remove API key exposure and restrict to family members
DROP POLICY IF EXISTS "Authenticated users can view active affiliates" ON public.approved_affiliates;

CREATE POLICY "Family members can view active affiliates" 
ON public.approved_affiliates 
FOR SELECT 
TO authenticated
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE user_id = auth.uid()
  )
);

-- Secure badge system - only show badges to family members
DROP POLICY IF EXISTS "Authenticated users can view badges" ON public.badges;

CREATE POLICY "Family members can view badges" 
ON public.badges 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE user_id = auth.uid()
  )
);

-- Add rate limiting for authentication attempts
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit_secure(ip_addr inet, email_addr text DEFAULT NULL::text, max_attempts integer DEFAULT 5, block_duration_minutes integer DEFAULT 15)
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
    -- Log blocked attempt
    PERFORM public.log_security_event(
      'blocked_auth_attempt',
      NULL,
      jsonb_build_object(
        'ip_address', ip_addr::text,
        'email', email_addr,
        'blocked_until', blocked_until_time
      )
    );
    RETURN false;
  END IF;
  
  -- Get current attempt count
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
  
  -- Log if blocked
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
  
  RETURN true;
END;
$function$;