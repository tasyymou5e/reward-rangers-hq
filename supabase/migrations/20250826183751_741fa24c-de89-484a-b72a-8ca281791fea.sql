-- Fix security definer view issue by dropping the problematic view
-- The safe_profiles_secure view with SECURITY DEFINER is flagged as a security risk

-- 1. Drop the existing safe_profiles_secure view to resolve the security warning
DROP VIEW IF EXISTS public.safe_profiles_secure;

-- 2. Since we updated the get_safe_profiles function with proper security controls,
-- users should call that function directly instead of using a view

-- 3. Update the audit trigger to prevent potential security issues with get_safe_profiles access
CREATE OR REPLACE FUNCTION public.audit_safe_profiles_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Enhanced logging for safe profiles access
  INSERT INTO public.security_alerts (
    user_id,
    alert_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'safe_profiles_access',
    'info',
    'User accessed safe profiles data via function',
    jsonb_build_object(
      'access_time', now(),
      'user_role', COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'unauthenticated'),
      'access_method', 'get_safe_profiles_function'
    )
  );
  RETURN NULL;
END;
$$;

-- 4. Add additional security to prevent potential privilege escalation
-- Revoke any unnecessary permissions on security functions
REVOKE ALL ON FUNCTION public.get_safe_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_rate_limits() FROM PUBLIC;

-- Grant only execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_safe_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_rate_limits() TO authenticated;

-- 5. Add function to check for security definer functions that might be risky
CREATE OR REPLACE FUNCTION public.audit_security_definer_usage()
RETURNS TABLE(
  function_name text,
  security_level text,
  recommendation text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.proname::text as function_name,
    CASE 
      WHEN p.prosecdef THEN 'SECURITY DEFINER'
      ELSE 'NORMAL'
    END as security_level,
    CASE 
      WHEN p.prosecdef THEN 'Review for potential security risks'
      ELSE 'Normal function'
    END as recommendation
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.prosecdef = true
  ORDER BY p.proname;
$$;

-- 6. Create a safer way to access profile data without SECURITY DEFINER views
-- This function provides controlled access without the security risks of views
CREATE OR REPLACE FUNCTION public.get_accessible_profiles_for_user(requesting_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  masked_email text,
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
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    -- Always mask emails for privacy unless viewing own profile or admin
    CASE
      WHEN p.id = requesting_user_id THEN p.email
      WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = requesting_user_id AND role = 'admin'::user_role) THEN p.email
      ELSE concat(left(p.email, 2), '***@', split_part(p.email, '@', 2))
    END AS masked_email,
    p.role,
    p.points,
    p.level,
    p.streak_days,
    p.avatar_url,
    p.created_at,
    p.last_activity
  FROM public.profiles p
  WHERE 
    requesting_user_id IS NOT NULL AND
    (
      p.id = requesting_user_id 
      OR EXISTS (
        SELECT 1 FROM public.families f, public.family_members fm 
        WHERE f.parent_id = requesting_user_id 
          AND fm.family_id = f.id 
          AND fm.user_id = p.id
      )
      OR EXISTS (
        SELECT 1 FROM public.family_members fm1, public.family_members fm2 
        WHERE fm1.user_id = requesting_user_id 
          AND fm2.user_id = p.id 
          AND fm1.family_id = fm2.family_id
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = requesting_user_id 
          AND admin_profile.role = 'admin'::user_role
      )
    );
$$;