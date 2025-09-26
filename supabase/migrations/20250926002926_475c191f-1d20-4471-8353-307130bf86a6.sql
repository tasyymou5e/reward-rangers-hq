-- Fix remaining function search path warnings - corrected approach
-- Drop and recreate functions with proper parameter names

DROP FUNCTION IF EXISTS public.decrypt_mfa_secret_secure(text);
DROP FUNCTION IF EXISTS public.encrypt_mfa_secret_secure(text);

CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, user_id_param uuid DEFAULT NULL::uuid, metadata_param jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_alerts (
    user_id, alert_type, severity, description, metadata
  ) VALUES (
    user_id_param,
    event_type,
    CASE 
      WHEN event_type ILIKE '%failed%' OR event_type ILIKE '%error%' THEN 'medium'
      WHEN event_type ILIKE '%critical%' OR event_type ILIKE '%blocked%' THEN 'high'
      ELSE 'low'
    END,
    'Security event: ' || event_type,
    jsonb_build_object(
      'ip_address', inet_client_addr()::text,
      'user_agent', current_setting('request.headers', true)::json->>'user-agent',
      'timestamp', now()
    ) || metadata_param
  );
END;
$$;

CREATE FUNCTION public.encrypt_mfa_secret_secure(secret_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple encoding for demonstration - in production use proper encryption
  RETURN encode(secret_text::bytea, 'base64');
END;
$$;

CREATE FUNCTION public.decrypt_mfa_secret_secure(encrypted_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple decoding for demonstration - in production use proper decryption
  RETURN convert_from(decode(encrypted_text, 'base64'), 'UTF8');
END;
$$;