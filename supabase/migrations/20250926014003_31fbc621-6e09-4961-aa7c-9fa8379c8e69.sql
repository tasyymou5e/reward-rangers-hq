-- Drop and recreate the get_family_data_secure function with correct signature
DROP FUNCTION IF EXISTS public.get_family_data_secure(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_family_data_secure(
  family_id_param UUID,
  requesting_user_id UUID
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  family_code TEXT,
  parent_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Validate user is authenticated
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Validate family access using the correct two-parameter function
  IF NOT (
    public.is_family_member(family_id_param, requesting_user_id) OR 
    public.is_family_parent(family_id_param, requesting_user_id) OR
    public.is_admin()
  ) THEN
    -- Log unauthorized access attempt
    PERFORM public.log_security_event(
      'unauthorized_family_access_attempt',
      requesting_user_id,
      jsonb_build_object(
        'family_id', family_id_param,
        'timestamp', now(),
        'ip_address', inet_client_addr()::text
      )
    );
    RAISE EXCEPTION 'Access denied: not a family member';
  END IF;
  
  -- Log family data access
  PERFORM public.log_security_event_with_rate_limit(
    'family_data_accessed',
    requesting_user_id,
    jsonb_build_object(
      'family_id', family_id_param,
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
  
  RETURN QUERY
  SELECT f.id, f.name, f.family_code, f.parent_id, f.created_at, f.updated_at
  FROM public.families f
  WHERE f.id = family_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;