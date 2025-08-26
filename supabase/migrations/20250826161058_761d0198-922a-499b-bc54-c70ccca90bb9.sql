-- Completely recreate the safe_profiles view with explicit SECURITY INVOKER
-- This ensures the view respects the querying user's permissions and RLS policies

-- Drop the existing view completely
DROP VIEW IF EXISTS public.safe_profiles CASCADE;

-- Recreate with explicit SECURITY INVOKER to fix the linter warning
CREATE VIEW public.safe_profiles WITH (security_invoker = on) AS
SELECT 
  id,
  username,
  display_name,
  CASE
    WHEN (id = auth.uid()) THEN email
    ELSE concat(left(email, 2), '***@', split_part(email, '@', 2))
  END AS email,
  role,
  points,
  level,
  streak_days,
  avatar_url,
  created_at,
  last_activity
FROM public.profiles;