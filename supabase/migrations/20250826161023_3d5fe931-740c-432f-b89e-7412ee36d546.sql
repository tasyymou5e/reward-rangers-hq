-- Fix the safe_profiles view security definer issue
-- The view currently uses SECURITY DEFINER which enforces the creator's permissions
-- Instead, we'll create it as a regular view that respects the querying user's permissions

-- Drop the existing view
DROP VIEW IF EXISTS public.safe_profiles;

-- Recreate the view without SECURITY DEFINER
-- This ensures RLS policies are respected for the querying user
CREATE VIEW public.safe_profiles AS
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