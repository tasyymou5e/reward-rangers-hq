-- Check for any remaining security definer views
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE definition ILIKE '%security definer%' 
AND schemaname = 'public';

-- Drop and recreate safe_profiles view correctly (if it exists with security definer)
DROP VIEW IF EXISTS public.safe_profiles CASCADE;

-- Create the view without security definer properly
CREATE VIEW public.safe_profiles AS
SELECT 
  id,
  username,
  display_name,
  CASE 
    WHEN id = auth.uid() THEN email
    ELSE CONCAT(LEFT(email, 2), '***@', SPLIT_PART(email, '@', 2))
  END as email,
  role,
  points,
  level,
  streak_days,
  avatar_url,
  created_at,
  last_activity
FROM public.profiles;