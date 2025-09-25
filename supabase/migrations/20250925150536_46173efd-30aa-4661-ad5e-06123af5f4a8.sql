-- Complete fix for infinite recursion in profiles table
-- Drop ALL existing policies on profiles to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on profiles table
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Create the helper function for admin check (no self-reference)
CREATE OR REPLACE FUNCTION public.is_admin_like_from_auth()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data->>'role') IN ('admin','full_admin','read_only_admin','report_admin')
  );
$$;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create clean, non-recursive policies
CREATE POLICY "Users can select own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins can select all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin_like_from_auth());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin_like_from_auth())
WITH CHECK (public.is_admin_like_from_auth());