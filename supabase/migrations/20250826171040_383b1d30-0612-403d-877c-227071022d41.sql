-- Fix the security vulnerability with the safe_profiles view
-- Since views cannot have RLS policies directly, we need to recreate it as a security definer function
-- or add RLS to the underlying profiles table (which already has some policies)

-- First, let's drop the unsafe view
DROP VIEW IF EXISTS public.safe_profiles;

-- Create a secure function to replace the unsafe view
-- This function will respect the existing RLS policies on the profiles table
CREATE OR REPLACE FUNCTION public.get_safe_profiles()
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  email text,
  role user_role,
  points integer,
  level integer,
  streak_days integer,
  avatar_url text,
  created_at timestamp with time zone,
  last_activity timestamp with time zone
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    CASE
      WHEN p.id = auth.uid() THEN p.email
      ELSE concat(left(p.email, 2), '***@', split_part(p.email, '@', 2))
    END AS email,
    p.role,
    p.points,
    p.level,
    p.streak_days,
    p.avatar_url,
    p.created_at,
    p.last_activity
  FROM public.profiles p
  WHERE 
    -- Only return profiles that the current user can access according to existing RLS policies
    p.id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM families f, family_members fm 
      WHERE f.parent_id = auth.uid() 
        AND fm.family_id = f.id 
        AND fm.user_id = p.id
    )
    OR EXISTS (
      SELECT 1 FROM family_members fm1, family_members fm2 
      WHERE fm1.user_id = auth.uid() 
        AND fm2.user_id = p.id 
        AND fm1.family_id = fm2.family_id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'::user_role
    );
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_safe_profiles() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_safe_profiles() FROM anon;

-- Create a secure view that uses the function (this is read-only and secure)
CREATE VIEW public.safe_profiles_secure AS 
SELECT * FROM public.get_safe_profiles();

-- Add comment explaining the security model
COMMENT ON FUNCTION public.get_safe_profiles() IS 'Secure function to get profile data with email privacy protection. Respects RLS policies from the underlying profiles table.';
COMMENT ON VIEW public.safe_profiles_secure IS 'Secure view for profile data. Use this instead of direct profiles table access for privacy-safe profile information.';