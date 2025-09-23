-- Security Fix: Enhance notification system with proper authorization
-- Restrict notification creation to authenticated users and system functions only
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow users to create notifications for themselves or admins for system notifications
  user_id = auth.uid() OR 
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ))
);

-- Security Fix: Harden family code visibility
-- Add function to safely validate family codes without exposing them
CREATE OR REPLACE FUNCTION public.join_family_with_code_secure(family_code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family_record public.families;
  user_already_in_family boolean;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Validate family code format without exposing actual codes
  IF NOT public.validate_family_code_secure(family_code_input) THEN
    RAISE EXCEPTION 'Invalid family code format';
  END IF;
  
  -- Find family by code
  SELECT * INTO family_record 
  FROM public.families 
  WHERE family_code = family_code_input;
  
  IF family_record.id IS NULL THEN
    -- Log failed attempt
    PERFORM public.log_security_event(
      'invalid_family_code_attempt',
      auth.uid(),
      jsonb_build_object(
        'code_pattern', LEFT(family_code_input, 2) || '***',
        'timestamp', now()
      )
    );
    RAISE EXCEPTION 'Family not found';
  END IF;
  
  -- Check if user is already in this family
  SELECT EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_id = family_record.id AND user_id = auth.uid()
  ) INTO user_already_in_family;
  
  IF user_already_in_family THEN
    RAISE EXCEPTION 'User already member of this family';
  END IF;
  
  -- Add user to family
  INSERT INTO public.family_members (family_id, user_id)
  VALUES (family_record.id, auth.uid());
  
  -- Log successful join
  PERFORM public.log_security_event(
    'family_joined_successfully',
    auth.uid(),
    jsonb_build_object(
      'family_id', family_record.id,
      'family_name', family_record.name,
      'timestamp', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'family_id', family_record.id,
    'family_name', family_record.name
  );
END;
$$;

-- Security Fix: Restrict rate limit data access to security admins only
DROP POLICY IF EXISTS "Controlled rate limit management" ON public.auth_rate_limits;

CREATE POLICY "Security admins only rate limit access"
ON public.auth_rate_limits FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Security Fix: Enhanced MFA audit logging
CREATE OR REPLACE FUNCTION public.log_mfa_access_secure(access_type text, metadata_param jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enhanced logging for all MFA-related access
  PERFORM public.log_security_event_with_rate_limit(
    'mfa_access_' || access_type,
    auth.uid(),
    jsonb_build_object(
      'access_type', access_type,
      'timestamp', now(),
      'ip_address', inet_client_addr()::text,
      'user_agent', current_setting('request.headers', true)::json->>'user-agent',
      'session_id', current_setting('request.jwt.claims', true)::json->>'session_id'
    ) || metadata_param
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_family_with_code_secure(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_mfa_access_secure(text, jsonb) TO authenticated;