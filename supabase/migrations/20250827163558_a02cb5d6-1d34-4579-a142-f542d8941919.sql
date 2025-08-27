-- Fix security linter warnings: Remove SECURITY DEFINER view and improve access control

-- 1. Drop the problematic view (security definer views are flagged as security risks)
DROP VIEW IF EXISTS public.mfa_status_safe;

-- 2. Create a more secure function-based approach instead of a view
CREATE OR REPLACE FUNCTION public.get_mfa_status_safe()
RETURNS TABLE(
  mfa_enabled boolean,
  has_totp_secret boolean,
  backup_codes_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Log access attempt with rate limiting
  PERFORM public.log_security_event_with_rate_limit(
    'mfa_status_checked',
    auth.uid(),
    jsonb_build_object(
      'action', 'check_status',
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
  
  RETURN QUERY
  SELECT 
    COALESCE(ums.mfa_enabled, false) as mfa_enabled,
    (ums.totp_secret IS NOT NULL) as has_totp_secret,
    COALESCE(array_length(ums.backup_codes, 1), 0) as backup_codes_count,
    ums.created_at,
    ums.updated_at
  FROM public.user_mfa_settings ums
  WHERE ums.user_id = auth.uid();
  
  -- If no record exists, return default values
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      false as mfa_enabled,
      false as has_totp_secret,
      0 as backup_codes_count,
      null::timestamp with time zone as created_at,
      null::timestamp with time zone as updated_at;
  END IF;
END;
$$;

-- 3. Ensure proper grants for the function
GRANT EXECUTE ON FUNCTION public.get_mfa_status_safe() TO authenticated;

-- 4. Update RLS policy to be even more restrictive for direct table access
DROP POLICY IF EXISTS "Restrict direct MFA table access" ON public.user_mfa_settings;

-- Create a policy that essentially blocks all direct access and forces use of functions
CREATE POLICY "Block direct MFA table access - use functions only"
ON public.user_mfa_settings
FOR ALL
USING (
  -- Only allow emergency admin access for maintenance
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
  -- Log any direct access attempts
  AND (
    SELECT public.log_security_event(
      'unauthorized_mfa_direct_access_attempt',
      auth.uid(),
      jsonb_build_object(
        'table', 'user_mfa_settings',
        'timestamp', now(),
        'recommendation', 'Use secure functions instead'
      )
    ) IS NOT NULL OR true
  )
)
WITH CHECK (
  -- Same restrictions for inserts/updates
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- 5. Add comprehensive audit logging for any table access
CREATE OR REPLACE FUNCTION public.comprehensive_mfa_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log every single access to the MFA table with detailed information
  INSERT INTO public.security_alerts (
    user_id,
    alert_type,
    severity,
    description,
    metadata
  ) VALUES (
    COALESCE(auth.uid(), 
      CASE 
        WHEN TG_OP = 'INSERT' THEN NEW.user_id
        WHEN TG_OP = 'UPDATE' THEN NEW.user_id
        WHEN TG_OP = 'DELETE' THEN OLD.user_id
        ELSE NULL
      END
    ),
    'mfa_table_access_detected',
    CASE 
      WHEN auth.uid() IS NULL THEN 'critical'
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) 
        THEN 'high'
      ELSE 'medium'
    END,
    'Direct MFA table access detected - should use secure functions',
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'user_role', COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'unknown'),
      'recommendation', 'Use get_mfa_settings_secure() or update_mfa_settings_secure() functions',
      'ip_address', inet_client_addr()::text,
      'has_auth_user', (auth.uid() IS NOT NULL)
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Replace the existing audit trigger with the comprehensive one
DROP TRIGGER IF EXISTS audit_mfa_access_trigger ON public.user_mfa_settings;
DROP TRIGGER IF EXISTS log_mfa_access_trigger ON public.user_mfa_settings;

CREATE TRIGGER comprehensive_mfa_audit_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.comprehensive_mfa_audit();

-- 6. Create a maintenance function for admins to clean up old MFA data
CREATE OR REPLACE FUNCTION public.cleanup_old_mfa_data(days_old integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleaned_count integer;
BEGIN
  -- Only allow admins to run cleanup
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Clean up old disabled MFA settings
  DELETE FROM public.user_mfa_settings
  WHERE mfa_enabled = false 
    AND updated_at < now() - (days_old || ' days')::interval;
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Log the cleanup operation
  PERFORM public.log_security_event(
    'mfa_data_cleanup',
    auth.uid(),
    jsonb_build_object(
      'records_cleaned', cleaned_count,
      'days_old_threshold', days_old,
      'timestamp', now()
    )
  );
  
  RETURN cleaned_count;
END;
$$;

-- Grant execute permission to admins only
REVOKE ALL ON FUNCTION public.cleanup_old_mfa_data(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.cleanup_old_mfa_data(integer) TO authenticated;