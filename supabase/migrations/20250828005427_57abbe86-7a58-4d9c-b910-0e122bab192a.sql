-- Fix the database function with correct column references
DROP FUNCTION IF EXISTS public.get_profile_by_id_secure(uuid, uuid);

-- Create a corrected version of the function
CREATE OR REPLACE FUNCTION public.get_profile_by_id_secure(
  target_user_id uuid,
  requesting_user_id uuid
)
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  role text,
  email text,
  avatar_url text,
  points integer,
  level integer,
  streak_days integer,
  last_activity timestamptz,
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
      WHERE p.id = requesting_user_id 
      AND p.role IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;

  -- Return the profile data with explicit column references
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role::text,
    p.email,
    p.avatar_url,
    p.points,
    p.level,
    p.streak_days,
    p.last_activity,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;

-- Drop and recreate simplified RLS policies to fix infinite recursion
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for admins to all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users on their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for admins on all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile access only" ON public.profiles;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Create simplified, non-recursive RLS policies
CREATE POLICY "Users can access their own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can access all profiles"
ON public.profiles FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Block anonymous access"
ON public.profiles FOR ALL
USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_profile_by_id_secure(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_by_id_secure(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;