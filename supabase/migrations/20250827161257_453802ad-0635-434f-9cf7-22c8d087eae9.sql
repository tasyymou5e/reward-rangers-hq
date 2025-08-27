-- Phase 1: Critical Security Fixes

-- 1. Create enhanced safe profiles function that never exposes emails to non-admins
CREATE OR REPLACE FUNCTION public.get_safe_profiles_limited()
RETURNS TABLE(
  id uuid, 
  username text, 
  display_name text, 
  role user_role, 
  points integer, 
  level integer, 
  streak_days integer, 
  avatar_url text, 
  created_at timestamp with time zone, 
  last_activity timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role,
    p.points,
    p.level,
    p.streak_days,
    p.avatar_url,
    p.created_at,
    p.last_activity
  FROM public.profiles p
  WHERE 
    auth.uid() IS NOT NULL AND
    (
      -- User can see their own profile
      p.id = auth.uid() 
      -- Family parents can see their children's profiles
      OR EXISTS (
        SELECT 1 FROM public.families f, public.family_members fm 
        WHERE f.parent_id = auth.uid() 
          AND fm.family_id = f.id 
          AND fm.user_id = p.id
      )
      -- Family members can see each other's basic profiles (no email)
      OR EXISTS (
        SELECT 1 FROM public.family_members fm1, public.family_members fm2 
        WHERE fm1.user_id = auth.uid() 
          AND fm2.user_id = p.id 
          AND fm1.family_id = fm2.family_id
      )
      -- Full admins can see all profiles
      OR EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
          AND admin_profile.role IN ('admin'::user_role, 'full_admin'::user_role)
      )
    );
$function$

-- 2. Enhanced admin role checking function
CREATE OR REPLACE FUNCTION public.is_any_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('admin'::user_role, 'full_admin'::user_role, 'read_only_admin'::user_role, 'report_admin'::user_role)
  );
$function$

-- 3. Restrict security alerts to system processes only
DROP POLICY IF EXISTS "System can create security alerts" ON public.security_alerts;

CREATE POLICY "Controlled security alert creation" 
ON public.security_alerts 
FOR INSERT 
WITH CHECK (
  -- Only allow service role or through security functions
  auth.uid() IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- 4. Add security monitoring for profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access to profiles for security monitoring
  IF auth.uid() IS NOT NULL AND OLD.id != auth.uid() THEN
    PERFORM public.log_security_event(
      'profile_access',
      auth.uid(),
      jsonb_build_object(
        'accessed_profile_id', OLD.id,
        'access_time', now(),
        'access_type', 'profile_view'
      )
    );
  END IF;
  RETURN OLD;
END;
$function$

-- Create trigger for profile access logging
DROP TRIGGER IF EXISTS log_profile_access_trigger ON public.profiles;
CREATE TRIGGER log_profile_access_trigger
  AFTER SELECT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.log_profile_access();

-- 5. Enhanced MFA audit logging
CREATE OR REPLACE FUNCTION public.log_mfa_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log all MFA settings access for security monitoring
  PERFORM public.log_security_event(
    'mfa_settings_access',
    auth.uid(),
    jsonb_build_object(
      'access_time', now(),
      'operation', TG_OP,
      'mfa_enabled', COALESCE(NEW.mfa_enabled, OLD.mfa_enabled)
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$

-- Create trigger for MFA access logging
DROP TRIGGER IF EXISTS log_mfa_access_trigger ON public.user_mfa_settings;
CREATE TRIGGER log_mfa_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_mfa_settings
  FOR EACH ROW 
  EXECUTE FUNCTION public.log_mfa_access();

-- 6. Add rate limiting for security events
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
  -- Check for rate limiting (max 10 events per user per minute)
  SELECT COUNT(*) INTO recent_events_count
  FROM public.security_alerts
  WHERE user_id = user_id_param
    AND alert_type = event_type
    AND created_at > now() - interval '1 minute';
    
  IF recent_events_count >= 10 THEN
    -- Log rate limit exceeded but don't create excessive alerts
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
  
  -- Proceed with normal logging
  PERFORM public.log_security_event(event_type, user_id_param, metadata_param);
END;
$function$