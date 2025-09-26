-- PRIORITY 1: Fix RLS recursion in profiles table by using auth.users directly
-- This prevents the infinite recursion issue with profile role checking

-- Drop existing problematic policies that may cause recursion
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new policies using auth.users directly to avoid RLS recursion
CREATE POLICY "Admins can select all profiles via auth check" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
  )
);

CREATE POLICY "Admins can update all profiles via auth check" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
  )
);

-- PRIORITY 2: Restrict auth_rate_limits access to only full admins
-- Currently all admins can see rate limit data which may expose sensitive IP information

DROP POLICY IF EXISTS "Security admins only rate limit access" ON public.auth_rate_limits;

CREATE POLICY "Full admins only rate limit access" 
ON public.auth_rate_limits 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin')
  )
);

-- PRIORITY 3: Create security function to safely check critical admin permissions
CREATE OR REPLACE FUNCTION public.is_critical_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin')
  );
$$;