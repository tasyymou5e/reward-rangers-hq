-- Create enhanced admin access functions and fix RLS policies for admin data loading

-- Enhanced function to check if current user is admin using auth.users
CREATE OR REPLACE FUNCTION public.is_admin_enhanced()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT (raw_user_meta_data->>'role') IN ('admin', 'full_admin', 'read_only_admin', 'report_admin') 
     FROM auth.users 
     WHERE id = auth.uid()),
    false
  );
$$;

-- Function to get all profiles for admins (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  email text,
  avatar_url text,
  role text,
  points integer,
  level integer,
  streak_days integer,
  last_activity timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  email_verified boolean,
  alternative_emails jsonb,
  is_primary_designator boolean,
  parent_email_designator uuid,
  email_alias text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admin users to call this function
  IF NOT is_admin_enhanced() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.email,
    p.avatar_url,
    p.role::text,
    p.points,
    p.level,
    p.streak_days,
    p.last_activity,
    p.created_at,
    p.updated_at,
    p.email_verified,
    p.alternative_emails,
    p.is_primary_designator,
    p.parent_email_designator,
    p.email_alias
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get all families for admins (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_all_families_for_admin()
RETURNS TABLE (
  id uuid,
  parent_id uuid,
  name text,
  family_code text,
  description text,
  avatar_url text,
  primary_email_designator text,
  email_domain text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  settings jsonb,
  archived_at timestamp with time zone,
  created_by_primary_email boolean,
  primary_email_designator_id uuid,
  family_email_domain text,
  parent_display_name text,
  parent_email text,
  member_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admin users to call this function
  IF NOT is_admin_enhanced() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    f.id,
    f.parent_id,
    f.name,
    f.family_code,
    f.description,
    f.avatar_url,
    f.primary_email_designator,
    f.email_domain,
    f.created_at,
    f.updated_at,
    f.settings,
    f.archived_at,
    f.created_by_primary_email,
    f.primary_email_designator_id,
    f.family_email_domain,
    p.display_name as parent_display_name,
    p.email as parent_email,
    COALESCE(fm.member_count, 0) as member_count
  FROM families f
  LEFT JOIN profiles p ON f.parent_id = p.id
  LEFT JOIN (
    SELECT family_id, COUNT(*) as member_count
    FROM family_members
    GROUP BY family_id
  ) fm ON f.id = fm.family_id
  ORDER BY f.created_at DESC;
END;
$$;

-- Add new RLS policy for admin access using the enhanced function
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Enhanced admin access to all profiles'
  ) THEN
    CREATE POLICY "Enhanced admin access to all profiles"
    ON profiles
    FOR ALL
    TO authenticated
    USING (is_admin_enhanced())
    WITH CHECK (is_admin_enhanced());
  END IF;
END $$;

-- Log the migration
INSERT INTO public.security_alerts (
  user_id,
  alert_type,
  severity,
  description,
  metadata
) VALUES (
  auth.uid(),
  'admin_access_functions_created',
  'low',
  'Enhanced admin access functions created for data loading',
  jsonb_build_object(
    'functions_created', ARRAY['is_admin_enhanced', 'get_all_profiles_for_admin', 'get_all_families_for_admin'],
    'migration_date', now()
  )
);