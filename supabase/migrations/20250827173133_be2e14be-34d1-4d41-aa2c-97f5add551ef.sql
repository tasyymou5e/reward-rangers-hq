-- Enhanced child data protection policies and functions

-- Create function to check if user has parental authority over a child
CREATE OR REPLACE FUNCTION public.has_parental_authority(child_user_id uuid, requesting_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return false if no requesting user
  IF requesting_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if requesting user is a parent of the child
  RETURN EXISTS (
    SELECT 1 
    FROM public.families f
    JOIN public.family_members fm ON f.id = fm.family_id
    WHERE f.parent_id = requesting_user_id
      AND fm.user_id = child_user_id
  );
END;
$$;

-- Create function to validate child data access with enhanced logging
CREATE OR REPLACE FUNCTION public.validate_child_data_access_secure(
  child_user_id uuid,
  access_type text,
  requesting_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  access_granted boolean := false;
  user_role user_role;
BEGIN
  -- Get requesting user's role
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = requesting_user_id;
  
  -- Check access based on role and relationship
  IF user_role = 'admin' THEN
    access_granted := true;
  ELSIF user_role = 'parent' THEN
    access_granted := public.has_parental_authority(child_user_id, requesting_user_id);
  ELSIF user_role = 'kid' AND requesting_user_id = child_user_id THEN
    access_granted := true;
  ELSE
    access_granted := false;
  END IF;
  
  -- Log the access attempt
  PERFORM public.log_security_event_with_rate_limit(
    'child_data_access_attempt',
    requesting_user_id,
    jsonb_build_object(
      'child_user_id', child_user_id,
      'access_type', access_type,
      'access_granted', access_granted,
      'user_role', user_role,
      'timestamp', now()
    )
  );
  
  RETURN access_granted;
END;
$$;

-- Enhanced family code validation function
CREATE OR REPLACE FUNCTION public.validate_family_code_secure(code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_count integer;
  requesting_ip inet;
BEGIN
  -- Get client IP
  requesting_ip := inet_client_addr();
  
  -- Check rate limiting for family code attempts
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_alerts
  WHERE alert_type = 'family_code_validation_attempt'
    AND created_at > now() - interval '1 hour'
    AND metadata->>'ip_address' = requesting_ip::text;
  
  -- Rate limit: max 10 attempts per hour per IP
  IF attempt_count >= 10 THEN
    PERFORM public.log_security_event(
      'family_code_rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'ip_address', requesting_ip::text,
        'attempt_count', attempt_count
      )
    );
    RETURN false;
  END IF;
  
  -- Log the validation attempt
  PERFORM public.log_security_event(
    'family_code_validation_attempt',
    auth.uid(),
    jsonb_build_object(
      'ip_address', requesting_ip::text,
      'code_pattern', LEFT(code, 2) || '***',
      'code_length', LENGTH(code)
    )
  );
  
  -- Validate format: 6-12 alphanumeric characters
  IF code !~ '^[A-Z0-9]{6,12}$' THEN
    RETURN false;
  END IF;
  
  -- Check if code exists and is valid
  RETURN EXISTS (
    SELECT 1 FROM public.families 
    WHERE family_code = code
  );
END;
$$;

-- Function to get client IP safely
CREATE OR REPLACE FUNCTION public.get_client_ip_safe()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return sanitized IP address or placeholder
  RETURN COALESCE(
    CASE 
      WHEN inet_client_addr() IS NOT NULL 
      THEN inet_client_addr()::text 
      ELSE 'unknown' 
    END
  );
END;
$$;