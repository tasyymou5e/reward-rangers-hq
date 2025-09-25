-- Check and fix the get_profile_by_id_secure function used by admin auth
-- This function might have been affected by the previous RLS policy changes

-- First, let's recreate the function with proper handling
CREATE OR REPLACE FUNCTION public.get_profile_by_id_secure(target_user_id uuid, requesting_user_id uuid)
RETURNS TABLE(id uuid, username text, display_name text, role text, email text, avatar_url text, points integer, level integer, streak_days integer, last_activity timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Admin users can access any profile
  IF public.is_current_user_admin() THEN
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
    RETURN;
  END IF;

  -- Users can only access their own profile
  IF target_user_id = requesting_user_id THEN
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
    RETURN;
  END IF;

  -- If none of the above conditions are met, raise an exception
  RAISE EXCEPTION 'Access denied: insufficient permissions';
END;
$$;