-- Fix critical security tables RLS policies

-- 1. Fix auth_rate_limits table policies
-- Drop existing incomplete policy
DROP POLICY IF EXISTS "Admins can manage rate limits" ON public.auth_rate_limits;

-- Create comprehensive RLS policies for auth_rate_limits
-- Allow system functions to manage rate limits (insert/update for rate limiting)
CREATE POLICY "System can manage rate limits" 
ON public.auth_rate_limits 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Only admins can view rate limit data for monitoring
CREATE POLICY "Admins can view rate limits" 
ON public.auth_rate_limits 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- 2. Fix safe_profiles_secure table - add missing RLS policies
-- This table currently has NO RLS policies which is a critical security issue
ALTER TABLE public.safe_profiles_secure ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access safe profiles through the security function
CREATE POLICY "Authenticated users can view safe profiles" 
ON public.safe_profiles_secure 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Prevent direct modifications to the secure view
CREATE POLICY "No direct modifications allowed" 
ON public.safe_profiles_secure 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No direct updates allowed" 
ON public.safe_profiles_secure 
FOR UPDATE 
USING (false);

CREATE POLICY "No direct deletes allowed" 
ON public.safe_profiles_secure 
FOR DELETE 
USING (false);

-- 3. Create additional security function for rate limit management
CREATE OR REPLACE FUNCTION public.can_manage_rate_limits()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow system functions and admins to manage rate limits
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) OR auth.uid() IS NULL; -- NULL uid indicates system/service role calls
$$;

-- 4. Update rate limits policies to use the security function
DROP POLICY IF EXISTS "System can manage rate limits" ON public.auth_rate_limits;

-- Allow authenticated rate limit management through security function
CREATE POLICY "Controlled rate limit management" 
ON public.auth_rate_limits 
FOR ALL 
USING (public.can_manage_rate_limits())
WITH CHECK (public.can_manage_rate_limits());

-- 5. Add audit logging for security table access
CREATE OR REPLACE FUNCTION public.log_security_table_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to security-critical tables
  IF TG_TABLE_NAME = 'auth_rate_limits' THEN
    PERFORM public.log_security_event(
      'rate_limit_access',
      auth.uid(),
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now()
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