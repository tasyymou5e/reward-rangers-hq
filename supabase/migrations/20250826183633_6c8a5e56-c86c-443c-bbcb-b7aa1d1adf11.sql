-- Fix critical security tables RLS policies (corrected version)

-- 1. Fix auth_rate_limits table policies
-- Drop existing incomplete policy
DROP POLICY IF EXISTS "Admins can manage rate limits" ON public.auth_rate_limits;

-- Create security function for rate limit management
CREATE OR REPLACE FUNCTION public.can_manage_rate_limits()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Allow system functions (service role) and admins to manage rate limits
  SELECT 
    auth.uid() IS NULL OR -- System/service role calls
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    );
$$;

-- Allow controlled rate limit management through security function
CREATE POLICY "Controlled rate limit management" 
ON public.auth_rate_limits 
FOR ALL 
USING (public.can_manage_rate_limits())
WITH CHECK (public.can_manage_rate_limits());

-- 2. Since safe_profiles_secure is a view, we need to secure the underlying function
-- Let's update the get_safe_profiles function to have proper access controls
CREATE OR REPLACE FUNCTION public.get_safe_profiles()
RETURNS TABLE(
  id uuid, 
  username text, 
  display_name text, 
  email text, 
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
  -- Only allow authenticated users to access safe profiles
  SELECT 
    p.id,
    p.username,
    p.display_name,
    -- Enhanced email masking for better privacy
    CASE
      WHEN p.id = auth.uid() THEN p.email
      WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) THEN p.email
      ELSE concat(left(p.email, 2), '***@', split_part(p.email, '@', 2))
    END AS email,
    p.role,
    p.points,
    p.level,
    p.streak_days,
    p.avatar_url,
    p.created_at,
    p.last_activity
  FROM public.profiles p
  WHERE 
    -- Only allow access if user is authenticated
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
      -- Family members can see each other's profiles
      OR EXISTS (
        SELECT 1 FROM public.family_members fm1, public.family_members fm2 
        WHERE fm1.user_id = auth.uid() 
          AND fm2.user_id = p.id 
          AND fm1.family_id = fm2.family_id
      )
      -- Admins can see all profiles
      OR EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
          AND admin_profile.role = 'admin'::user_role
      )
    );
$$;

-- 3. Add comprehensive audit logging for security table access
CREATE OR REPLACE FUNCTION public.log_security_table_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to security-critical tables
  IF TG_TABLE_NAME = 'auth_rate_limits' THEN
    INSERT INTO public.security_alerts (
      user_id,
      alert_type,
      severity,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'rate_limit_table_access',
      'info',
      'Rate limit table accessed',
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now(),
        'user_role', COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'system')
      )
    );
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Add audit trigger to rate limits table
DROP TRIGGER IF EXISTS audit_rate_limits_access ON public.auth_rate_limits;
CREATE TRIGGER audit_rate_limits_access
  AFTER INSERT OR UPDATE OR DELETE ON public.auth_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.log_security_table_access();

-- 4. Create additional security monitoring function
CREATE OR REPLACE FUNCTION public.monitor_security_table_integrity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_count integer;
BEGIN
  -- Check for suspicious rate limit bypasses
  SELECT COUNT(*) INTO suspicious_count
  FROM public.auth_rate_limits
  WHERE attempt_count > 20 AND blocked_until IS NULL;
  
  IF suspicious_count > 0 THEN
    INSERT INTO public.security_alerts (
      alert_type,
      severity,
      description,
      metadata
    ) VALUES (
      'rate_limit_bypass_detected',
      'high',
      'Potential rate limit bypass detected',
      jsonb_build_object(
        'suspicious_records', suspicious_count,
        'timestamp', now()
      )
    );
  END IF;
END;
$$;

-- 5. Add policy for security alerts table to ensure proper access control
-- Drop and recreate to ensure consistency
DROP POLICY IF EXISTS "Admins can view all security alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "Admins can manage security alerts" ON public.security_alerts;

CREATE POLICY "Admins can view security alerts" 
ON public.security_alerts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

CREATE POLICY "System can create security alerts" 
ON public.security_alerts 
FOR INSERT 
WITH CHECK (true); -- Allow system to create alerts

CREATE POLICY "Admins can manage security alerts" 
ON public.security_alerts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);