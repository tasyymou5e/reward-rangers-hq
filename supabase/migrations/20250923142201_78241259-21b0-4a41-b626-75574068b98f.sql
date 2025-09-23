-- Final security hardening: Add comprehensive audit triggers and enhanced logging

-- Enhanced security audit for profiles table access
CREATE OR REPLACE FUNCTION public.audit_profile_access_comprehensive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all profile access attempts with enhanced metadata
  INSERT INTO public.security_alerts (
    user_id,
    alert_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'profile_table_direct_access',
    CASE 
      WHEN TG_OP = 'SELECT' THEN 'info'
      WHEN TG_OP IN ('INSERT', 'UPDATE') THEN 'medium'
      WHEN TG_OP = 'DELETE' THEN 'high'
      ELSE 'medium'
    END,
    'Direct profile table access detected - recommend using secure functions',
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'user_role', COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'unknown'),
      'recommendation', 'Use get_profile_by_id_secure() or get_profiles_secure() functions',
      'ip_address', inet_client_addr()::text,
      'session_info', current_setting('request.jwt.claims', true)::json
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for comprehensive profile access auditing
DROP TRIGGER IF EXISTS audit_profile_access_comprehensive_trigger ON public.profiles;
CREATE TRIGGER audit_profile_access_comprehensive_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_access_comprehensive();

-- Enhanced function to create system notifications with proper authorization
CREATE OR REPLACE FUNCTION public.create_system_notification_secure(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  notification_type text DEFAULT 'info',
  notification_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Validate caller is authenticated admin or system function
  IF auth.uid() IS NULL THEN
    -- Allow system calls (service role)
    NULL;
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required for system notifications';
  END IF;
  
  -- Validate target user exists
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    data
  ) VALUES (
    target_user_id,
    notification_title,
    notification_message,
    notification_type,
    notification_data
  ) RETURNING id INTO notification_id;
  
  -- Log system notification creation
  PERFORM public.log_security_event(
    'system_notification_created',
    auth.uid(),
    jsonb_build_object(
      'notification_id', notification_id,
      'target_user_id', target_user_id,
      'notification_type', notification_type,
      'created_by', COALESCE(auth.uid()::text, 'system'),
      'timestamp', now()
    )
  );
  
  RETURN notification_id;
END;
$$;

-- Grant permissions for system notification function
GRANT EXECUTE ON FUNCTION public.create_system_notification_secure(uuid, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_system_notification_secure(uuid, text, text, text, jsonb) TO service_role;

-- Enhanced rate limiting with IP-based protection
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(
  action_type text,
  max_per_hour integer DEFAULT 60,
  max_per_day integer DEFAULT 1000
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hourly_count integer;
  daily_count integer;
  user_ip inet;
BEGIN
  user_ip := inet_client_addr();
  
  -- Count actions in the last hour
  SELECT COUNT(*) INTO hourly_count
  FROM public.security_alerts
  WHERE alert_type = action_type
    AND (user_id = auth.uid() OR metadata->>'ip_address' = user_ip::text)
    AND created_at > now() - interval '1 hour';
  
  -- Count actions in the last day
  SELECT COUNT(*) INTO daily_count
  FROM public.security_alerts
  WHERE alert_type = action_type
    AND (user_id = auth.uid() OR metadata->>'ip_address' = user_ip::text)
    AND created_at > now() - interval '1 day';
  
  -- Check limits
  IF hourly_count >= max_per_hour OR daily_count >= max_per_day THEN
    PERFORM public.log_security_event(
      'enhanced_rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'action_type', action_type,
        'hourly_count', hourly_count,
        'daily_count', daily_count,
        'max_per_hour', max_per_hour,
        'max_per_day', max_per_day,
        'ip_address', user_ip::text
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit_enhanced(text, integer, integer) TO authenticated;