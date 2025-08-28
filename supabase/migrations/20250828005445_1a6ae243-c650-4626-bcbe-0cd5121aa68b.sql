-- Fix the security warnings by setting proper search paths
DROP FUNCTION IF EXISTS public.get_profile_by_id_secure(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- Create the admin check function with proper security settings
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Create the secure profile function with proper security settings
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
SET search_path = public, auth
AS $$
BEGIN
  -- Security check: Only allow users to access their own profile or admin users
  IF target_user_id != requesting_user_id AND NOT (
    SELECT public.is_current_user_admin()
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_profile_by_id_secure(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_by_id_secure(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;