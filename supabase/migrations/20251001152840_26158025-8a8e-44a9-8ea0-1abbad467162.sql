-- Fix get_all_families_for_admin to include family_members array
DROP FUNCTION IF EXISTS public.get_all_families_for_admin();

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
  member_count bigint,
  family_members jsonb
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
    COALESCE(fm_count.member_count, 0) as member_count,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object('user_id', fm.user_id))
        FROM family_members fm
        WHERE fm.family_id = f.id
      ),
      '[]'::jsonb
    ) as family_members
  FROM families f
  LEFT JOIN profiles p ON f.parent_id = p.id
  LEFT JOIN (
    SELECT family_id, COUNT(*) as member_count
    FROM family_members
    GROUP BY family_id
  ) fm_count ON f.id = fm_count.family_id
  ORDER BY f.created_at DESC;
END;
$$;