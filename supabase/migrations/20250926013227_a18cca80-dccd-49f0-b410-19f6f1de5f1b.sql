-- Fix security issues with families and profiles tables
-- Replace permissive public policies with restrictive authenticated-only policies

-- First, drop existing permissive policies for families table
DROP POLICY IF EXISTS "Family members can view their family" ON public.families;
DROP POLICY IF EXISTS "Parents can manage their families" ON public.families;

-- Create secure policies for families table (authenticated users only)
-- Use the two-parameter version of is_family_member function
CREATE POLICY "Family members can view their family" 
ON public.families 
FOR SELECT 
TO authenticated
USING (public.is_family_member(id, auth.uid()) OR (parent_id = auth.uid()));

CREATE POLICY "Parents can manage their families" 
ON public.families 
FOR ALL 
TO authenticated
USING ((parent_id = auth.uid()) OR is_admin())
WITH CHECK ((parent_id = auth.uid()) OR is_admin());

-- Drop existing permissive policies for profiles table  
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create secure policies for profiles table (authenticated users only)
CREATE POLICY "Admins can select all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin_like_from_auth());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (is_admin_like_from_auth())
WITH CHECK (is_admin_like_from_auth());

CREATE POLICY "Users can select own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Add additional security policy for families to prevent enumeration
CREATE POLICY "Prevent family enumeration" 
ON public.families 
FOR SELECT 
TO anon
USING (false);

-- Add additional security policy for profiles to prevent enumeration  
CREATE POLICY "Prevent profile enumeration" 
ON public.profiles 
FOR SELECT 
TO anon
USING (false);

-- Log the security fix
SELECT public.log_security_event(
  'security_vulnerability_fixed',
  auth.uid(),
  jsonb_build_object(
    'issue', 'families_and_profiles_public_access',
    'tables_affected', ARRAY['families', 'profiles'],
    'fix_applied', 'restricted_to_authenticated_users_only',
    'timestamp', now()
  )
);