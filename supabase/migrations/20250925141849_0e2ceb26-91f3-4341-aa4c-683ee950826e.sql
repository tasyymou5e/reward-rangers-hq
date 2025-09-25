-- Fix infinite recursion in profiles table RLS policies
-- Need to cascade drop dependent policies first

-- Drop all policies on profiles table that depend on functions
DROP POLICY IF EXISTS "Admins can access all profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles CASCADE;

-- Now safely drop the problematic functions
DROP FUNCTION IF EXISTS public.is_current_user_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- Create security definer function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Query auth.users directly to avoid RLS recursion on profiles
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND u.raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Create simple policies that don't cause recursion
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (public.is_current_user_admin());

CREATE POLICY "Enable insert for authenticated users only" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Update the is_admin function to use the new security definer function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_current_user_admin();
$$;