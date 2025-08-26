-- Enable pgcrypto extension for secure hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Phase 1: Critical Privacy Fix - Create safe profile access function
CREATE OR REPLACE FUNCTION public.get_safe_family_profiles(requesting_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid, 
  username text, 
  display_name text, 
  role user_role, 
  points integer, 
  level integer, 
  streak_days integer, 
  avatar_url text, 
  created_at timestamp with time zone, 
  last_activity timestamp with time zone
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role,
    p.points,
    p.level,
    p.streak_days,
    p.avatar_url,
    p.created_at,
    p.last_activity
  FROM public.profiles p
  WHERE 
    requesting_user_id IS NOT NULL AND
    (
      -- User can see their own profile
      p.id = requesting_user_id 
      -- Family parents can see their children's profiles
      OR EXISTS (
        SELECT 1 FROM public.families f, public.family_members fm 
        WHERE f.parent_id = requesting_user_id 
          AND fm.family_id = f.id 
          AND fm.user_id = p.id
      )
      -- Family members can see each other's basic profiles (no email)
      OR EXISTS (
        SELECT 1 FROM public.family_members fm1, public.family_members fm2 
        WHERE fm1.user_id = requesting_user_id 
          AND fm2.user_id = p.id 
          AND fm1.family_id = fm2.family_id
      )
      -- Admins can see all profiles
      OR EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = requesting_user_id 
          AND admin_profile.role = 'admin'::user_role
      )
    );
$$;

-- Replace the existing unsafe policy
DROP POLICY IF EXISTS "Users can view family members basic profiles" ON public.profiles;

CREATE POLICY "Family members can view safe profiles only"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.get_safe_family_profiles(auth.uid()) sp
    WHERE sp.id = profiles.id
  )
);

-- Improve MFA backup code security with proper hashing
CREATE OR REPLACE FUNCTION public.hash_backup_code(code text)
RETURNS text
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT encode(digest(code, 'sha256'), 'hex');
$$;