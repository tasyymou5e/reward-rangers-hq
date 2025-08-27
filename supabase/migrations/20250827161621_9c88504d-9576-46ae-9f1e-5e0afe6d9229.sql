-- Phase 1A: Enhanced safe profiles function
CREATE OR REPLACE FUNCTION public.get_safe_profiles_limited()
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
SET search_path TO 'public'
AS $function$
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
    auth.uid() IS NOT NULL AND
    (
      p.id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.families f, public.family_members fm 
        WHERE f.parent_id = auth.uid() 
          AND fm.family_id = f.id 
          AND fm.user_id = p.id
      )
      OR EXISTS (
        SELECT 1 FROM public.family_members fm1, public.family_members fm2 
        WHERE fm1.user_id = auth.uid() 
          AND fm2.user_id = p.id 
          AND fm1.family_id = fm2.family_id
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
          AND admin_profile.role IN ('admin'::user_role, 'full_admin'::user_role)
      )
    );
$function$