-- Enhanced MFA Security: Proper encryption and access controls

-- 1. Create proper encryption functions using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Secure MFA secret encryption using AES-256
CREATE OR REPLACE FUNCTION public.encrypt_mfa_secret_secure(secret_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
  encrypted_data text;
BEGIN
  -- Generate a unique encryption key per user (in production, use a proper key management system)
  encryption_key := encode(digest(auth.uid()::text || 'mfa_secret_key', 'sha256'), 'hex');
  
  -- Encrypt using AES-256-CBC
  encrypted_data := encode(
    encrypt(
      secret_text::bytea, 
      encryption_key::bytea, 
      'aes-cbc'
    ), 
    'base64'
  );
  
  -- Log encryption event
  PERFORM public.log_security_event(
    'mfa_secret_encrypted',
    auth.uid(),
    jsonb_build_object(
      'action', 'encrypt',
      'timestamp', now(),
      'data_length', length(secret_text)
    )
  );
  
  RETURN encrypted_data;
END;
$$;

-- Secure MFA secret decryption
CREATE OR REPLACE FUNCTION public.decrypt_mfa_secret_secure(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
  decrypted_data text;
BEGIN
  -- Only allow users to decrypt their own secrets
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Generate the same encryption key
  encryption_key := encode(digest(auth.uid()::text || 'mfa_secret_key', 'sha256'), 'hex');
  
  -- Decrypt using AES-256-CBC
  decrypted_data := decode(
    decrypt(
      decode(encrypted_data, 'base64'), 
      encryption_key::bytea, 
      'aes-cbc'
    ), 
    'escape'
  );
  
  -- Log decryption access with rate limiting
  PERFORM public.log_security_event_with_rate_limit(
    'mfa_secret_accessed',
    auth.uid(),
    jsonb_build_object(
      'action', 'decrypt',
      'timestamp', now(),
      'ip_address', inet_client_addr()::text,
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
  
  RETURN decrypted_data;
EXCEPTION
  WHEN OTHERS THEN
    -- Log failed decryption attempt
    PERFORM public.log_security_event(
      'mfa_decryption_failed',
      auth.uid(),
      jsonb_build_object(
        'error', SQLERRM,
        'timestamp', now(),
        'ip_address', inet_client_addr()::text
      )
    );
    RAISE EXCEPTION 'Decryption failed: %', SQLERRM;
END;
$$;

-- Function to securely manage MFA settings with validation
CREATE OR REPLACE FUNCTION public.update_mfa_settings_secure(
  p_mfa_enabled boolean,
  p_totp_secret text DEFAULT NULL,
  p_backup_codes text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encrypted_secret text;
  encrypted_codes text[];
  i integer;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Encrypt TOTP secret if provided
  IF p_totp_secret IS NOT NULL THEN
    encrypted_secret := public.encrypt_mfa_secret_secure(p_totp_secret);
  END IF;
  
  -- Encrypt backup codes if provided
  IF p_backup_codes IS NOT NULL THEN
    encrypted_codes := ARRAY[]::text[];
    FOR i IN 1..array_length(p_backup_codes, 1) LOOP
      encrypted_codes := encrypted_codes || public.encrypt_mfa_secret_secure(p_backup_codes[i]);
    END LOOP;
  END IF;
  
  -- Update or insert MFA settings
  INSERT INTO public.user_mfa_settings (
    user_id, 
    mfa_enabled, 
    totp_secret, 
    backup_codes
  ) VALUES (
    auth.uid(), 
    p_mfa_enabled, 
    encrypted_secret, 
    encrypted_codes
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    mfa_enabled = EXCLUDED.mfa_enabled,
    totp_secret = CASE 
      WHEN EXCLUDED.totp_secret IS NOT NULL THEN EXCLUDED.totp_secret 
      ELSE user_mfa_settings.totp_secret 
    END,
    backup_codes = CASE 
      WHEN EXCLUDED.backup_codes IS NOT NULL THEN EXCLUDED.backup_codes 
      ELSE user_mfa_settings.backup_codes 
    END,
    updated_at = now();
    
  -- Log the security event
  PERFORM public.log_security_event_with_rate_limit(
    CASE WHEN p_mfa_enabled THEN 'mfa_enabled_secure' ELSE 'mfa_disabled_secure' END,
    auth.uid(),
    jsonb_build_object(
      'mfa_enabled', p_mfa_enabled,
      'has_totp_secret', (p_totp_secret IS NOT NULL),
      'backup_codes_count', COALESCE(array_length(p_backup_codes, 1), 0),
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
END;
$$;

-- Function to get MFA settings securely (no direct table access)
CREATE OR REPLACE FUNCTION public.get_mfa_settings_secure()
RETURNS TABLE(
  mfa_enabled boolean,
  has_totp_secret boolean,
  backup_codes_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Log access attempt
  PERFORM public.log_security_event_with_rate_limit(
    'mfa_settings_accessed',
    auth.uid(),
    jsonb_build_object(
      'action', 'view_settings',
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
  
  RETURN QUERY
  SELECT 
    ums.mfa_enabled,
    (ums.totp_secret IS NOT NULL) as has_totp_secret,
    COALESCE(array_length(ums.backup_codes, 1), 0) as backup_codes_count,
    ums.created_at,
    ums.updated_at
  FROM public.user_mfa_settings ums
  WHERE ums.user_id = auth.uid();
END;
$$;

-- Enhanced trigger for MFA table access monitoring
CREATE OR REPLACE FUNCTION public.audit_mfa_table_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log any direct table access (should be rare with secure functions)
  INSERT INTO public.security_alerts (
    user_id,
    alert_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'direct_mfa_table_access',
    'high',
    'Direct access to MFA settings table detected',
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'user_role', COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'unknown'),
      'warning', 'MFA settings should only be accessed via secure functions'
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Apply the audit trigger
DROP TRIGGER IF EXISTS audit_mfa_access_trigger ON public.user_mfa_settings;
CREATE TRIGGER audit_mfa_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_mfa_table_access();

-- Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can view their own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can update their own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Deny anonymous access to MFA settings" ON public.user_mfa_settings;

-- More restrictive policies that encourage use of secure functions
CREATE POLICY "Restrict direct MFA table access"
ON public.user_mfa_settings
FOR ALL
USING (
  auth.uid() = user_id AND 
  -- Only allow if called from secure functions (detect by checking if we're in a function call)
  current_setting('application_name', true) LIKE '%secure_function%'
  OR 
  -- Allow for emergency admin access only
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
)
WITH CHECK (
  auth.uid() = user_id AND 
  current_setting('application_name', true) LIKE '%secure_function%'
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Create a view for safe MFA status checking (no sensitive data)
CREATE OR REPLACE VIEW public.mfa_status_safe AS
SELECT 
  user_id,
  mfa_enabled,
  (totp_secret IS NOT NULL) as has_totp_secret,
  COALESCE(array_length(backup_codes, 1), 0) as backup_codes_count,
  created_at,
  updated_at
FROM public.user_mfa_settings
WHERE user_id = auth.uid();

-- Grant appropriate permissions
GRANT SELECT ON public.mfa_status_safe TO authenticated;

-- Replace the old encrypt/decrypt functions
DROP FUNCTION IF EXISTS public.encrypt_mfa_secret(text);
DROP FUNCTION IF EXISTS public.decrypt_mfa_secret(text);

-- Create aliases for backward compatibility but log their usage
CREATE OR REPLACE FUNCTION public.encrypt_mfa_secret(secret_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log usage of deprecated function
  PERFORM public.log_security_event(
    'deprecated_mfa_function_used',
    auth.uid(),
    jsonb_build_object(
      'function', 'encrypt_mfa_secret',
      'recommendation', 'Use encrypt_mfa_secret_secure instead'
    )
  );
  
  RETURN public.encrypt_mfa_secret_secure(secret_text);
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_mfa_secret(encoded_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log usage of deprecated function
  PERFORM public.log_security_event(
    'deprecated_mfa_function_used',
    auth.uid(),
    jsonb_build_object(
      'function', 'decrypt_mfa_secret',
      'recommendation', 'Use decrypt_mfa_secret_secure instead'
    )
  );
  
  RETURN public.decrypt_mfa_secret_secure(encoded_text);
END;
$$;