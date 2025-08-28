-- Fix the ambiguous column reference in get_profile_by_id_secure function
DROP FUNCTION IF EXISTS public.get_profile_by_id_secure(uuid, uuid);

-- Create a corrected version of the function with proper table aliasing
CREATE OR REPLACE FUNCTION public.get_profile_by_id_secure(
  target_user_id uuid,
  requesting_user_id uuid
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  role text,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security check: Only allow users to access their own profile or admin users
  IF target_user_id != requesting_user_id AND NOT (
    SELECT EXISTS(
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = requesting_user_id 
      AND p.role IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;

  -- Return the profile data with explicit column references
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.role,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Drop and recreate RLS policies to fix infinite recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create simplified, non-recursive RLS policies
CREATE POLICY "Enable read access for users to their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for admins to all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.user_id = auth.uid()
    AND admin_profile.role IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
  )
);

CREATE POLICY "Enable insert for authenticated users"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users on their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for admins on all profiles"
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.user_id = auth.uid()
    AND admin_profile.role IN ('admin', 'full_admin')
  )
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_profile_by_id_secure(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_by_id_secure(uuid, uuid) TO anon;