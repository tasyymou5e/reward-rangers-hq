-- Fix infinite recursion in admin policies by using security definer functions

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all families" ON public.families;
DROP POLICY IF EXISTS "Admins can view all family members" ON public.family_members;
DROP POLICY IF EXISTS "Admins can view all chores" ON public.chores;
DROP POLICY IF EXISTS "Admins can view all progress logs" ON public.progress_logs;

-- Create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Now create admin policies using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view all families" 
ON public.families 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view all family members" 
ON public.family_members 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view all chores" 
ON public.chores 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view all progress logs" 
ON public.progress_logs 
FOR SELECT 
TO authenticated
USING (public.is_admin());