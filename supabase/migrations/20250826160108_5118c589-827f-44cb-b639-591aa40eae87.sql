-- Drop existing MFA functions first
DROP FUNCTION IF EXISTS public.encrypt_mfa_secret(text);
DROP FUNCTION IF EXISTS public.decrypt_mfa_secret(text);

-- Recreate MFA functions with proper parameters
CREATE OR REPLACE FUNCTION public.encrypt_mfa_secret(secret_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
IMMUTABLE
SET search_path = public
AS $$
  -- For now, use simple base64 encoding until encryption key is configured
  SELECT encode(secret_text::bytea, 'base64');
$$;

CREATE OR REPLACE FUNCTION public.decrypt_mfa_secret(encoded_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- For now, use simple base64 decoding until encryption key is configured
  SELECT decode(encoded_text, 'base64')::text;
$$;

-- Create enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_id_param uuid,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log to security alerts if it's suspicious
  IF event_type IN ('failed_login_attempt', 'suspicious_activity', 'data_access_violation') THEN
    INSERT INTO public.security_alerts (
      user_id,
      alert_type,
      severity,
      description,
      metadata
    ) VALUES (
      user_id_param,
      event_type,
      CASE 
        WHEN event_type = 'failed_login_attempt' THEN 'medium'
        WHEN event_type = 'data_access_violation' THEN 'high'
        ELSE 'medium'
      END,
      'Security event detected: ' || event_type,
      metadata_param
    );
  END IF;
  
  -- Log to MFA audit if applicable
  IF event_type LIKE '%mfa%' THEN
    INSERT INTO public.mfa_audit_log (
      user_id,
      action,
      ip_address,
      user_agent,
      success
    ) VALUES (
      user_id_param,
      event_type,
      (metadata_param->>'ip_address')::inet,
      metadata_param->>'user_agent',
      COALESCE((metadata_param->>'success')::boolean, true)
    );
  END IF;
END;
$$;

-- Create function to validate family relationships for security
CREATE OR REPLACE FUNCTION public.validate_family_access(
  family_id_param uuid,
  user_id_param uuid DEFAULT auth.uid(),
  required_role text DEFAULT 'member'
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN required_role = 'parent' THEN
      EXISTS (
        SELECT 1 FROM public.families 
        WHERE id = family_id_param AND parent_id = user_id_param
      )
    ELSE
      EXISTS (
        SELECT 1 FROM public.family_members 
        WHERE family_id = family_id_param AND user_id = user_id_param
      ) OR
      EXISTS (
        SELECT 1 FROM public.families 
        WHERE id = family_id_param AND parent_id = user_id_param
      )
  END;
$$;