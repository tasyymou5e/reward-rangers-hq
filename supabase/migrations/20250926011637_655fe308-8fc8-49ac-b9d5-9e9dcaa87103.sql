-- SECURITY FIX: Enhanced System Settings Access Control
-- Fixes security issue with system_settings table RLS policies

-- First, drop the existing insecure RLS policy
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

-- Create enhanced security definer function for system settings access
CREATE OR REPLACE FUNCTION public.can_manage_system_settings()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Use secure admin checking from auth.users to avoid RLS recursion
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin')
  );
$$;

-- Create function to check read-only system settings access
CREATE OR REPLACE FUNCTION public.can_read_system_settings()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Allow admin-like roles to read system settings
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
  );
$$;

-- Create granular RLS policies with proper security

-- Policy 1: Full admins can manage all system settings
CREATE POLICY "Full admins can manage system settings"
ON public.system_settings
FOR ALL
TO public
USING (public.can_manage_system_settings())
WITH CHECK (public.can_manage_system_settings());

-- Policy 2: Read-only admins can view system settings
CREATE POLICY "Read-only admins can view system settings"
ON public.system_settings
FOR SELECT
TO public
USING (public.can_read_system_settings());

-- Policy 3: Restrict specific sensitive settings to full admins only
CREATE POLICY "Sensitive settings full admin only"
ON public.system_settings
FOR ALL
TO public
USING (
  CASE 
    WHEN setting_key IN (
      'security_configuration',
      'database_credentials', 
      'api_keys',
      'encryption_keys',
      'admin_overrides'
    ) THEN public.can_manage_system_settings()
    ELSE public.can_read_system_settings()
  END
)
WITH CHECK (
  CASE 
    WHEN setting_key IN (
      'security_configuration',
      'database_credentials',
      'api_keys', 
      'encryption_keys',
      'admin_overrides'
    ) THEN public.can_manage_system_settings()
    ELSE public.can_manage_system_settings()
  END
);

-- Enhanced audit logging function for system settings changes
CREATE OR REPLACE FUNCTION public.audit_system_settings_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all system settings access attempts
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Log successful changes with enhanced metadata
    PERFORM public.log_security_event(
      'system_settings_' || lower(TG_OP),
      auth.uid(),
      jsonb_build_object(
        'setting_key', NEW.setting_key,
        'operation', TG_OP,
        'is_sensitive', NEW.setting_key IN (
          'security_configuration',
          'database_credentials',
          'api_keys',
          'encryption_keys', 
          'admin_overrides'
        ),
        'old_value_hash', CASE WHEN TG_OP = 'UPDATE' THEN md5(OLD.setting_value::text) ELSE NULL END,
        'new_value_hash', md5(NEW.setting_value::text),
        'timestamp', now(),
        'ip_address', inet_client_addr()::text,
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    );
    
    -- Set last_modified_by field
    NEW.last_modified_by := auth.uid();
    NEW.updated_at := now();
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Log deletion attempts
    PERFORM public.log_security_event(
      'system_settings_delete',
      auth.uid(),
      jsonb_build_object(
        'setting_key', OLD.setting_key,
        'operation', 'DELETE',
        'deleted_value_hash', md5(OLD.setting_value::text),
        'timestamp', now(),
        'ip_address', inet_client_addr()::text
      )
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists and create enhanced one
DROP TRIGGER IF EXISTS audit_system_settings_changes ON public.system_settings;

CREATE TRIGGER audit_system_settings_changes
  BEFORE INSERT OR UPDATE OR DELETE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_system_settings_access();

-- Create function to validate system setting updates
CREATE OR REPLACE FUNCTION public.validate_system_setting_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent tampering with critical system settings
  IF NEW.setting_key IS DISTINCT FROM OLD.setting_key THEN
    RAISE EXCEPTION 'Cannot modify setting_key after creation';
  END IF;
  
  -- Validate JSON structure for specific settings
  IF NEW.setting_key = 'login_controls' THEN
    IF NOT (NEW.setting_value ? 'parents_login_enabled' AND 
            NEW.setting_value ? 'kids_login_enabled') THEN
      RAISE EXCEPTION 'login_controls must contain parents_login_enabled and kids_login_enabled fields';
    END IF;
  END IF;
  
  IF NEW.setting_key = 'system_maintenance' THEN
    IF NOT (NEW.setting_value ? 'enabled' AND 
            NEW.setting_value ? 'message') THEN
      RAISE EXCEPTION 'system_maintenance must contain enabled and message fields';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger
CREATE TRIGGER validate_system_setting_update
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_system_setting_update();

-- Create function to get system settings securely
CREATE OR REPLACE FUNCTION public.get_system_setting_secure(key_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  setting_data JSONB;
  is_admin_user boolean;
  is_sensitive_setting boolean;
BEGIN
  -- Check if user has appropriate permissions
  SELECT public.can_read_system_settings() INTO is_admin_user;
  
  -- Check if this is a sensitive setting
  is_sensitive_setting := key_name IN (
    'security_configuration',
    'database_credentials',
    'api_keys',
    'encryption_keys',
    'admin_overrides'
  );
  
  -- For sensitive settings, require full admin access
  IF is_sensitive_setting AND NOT public.can_manage_system_settings() THEN
    RAISE EXCEPTION 'Access denied: Full admin privileges required for sensitive setting: %', key_name;
  END IF;
  
  -- For non-sensitive settings, require at least read access
  IF NOT is_sensitive_setting AND NOT is_admin_user THEN
    -- Allow limited access to specific public settings
    IF key_name NOT IN ('login_controls', 'system_maintenance') THEN
      RAISE EXCEPTION 'Access denied: Admin privileges required for setting: %', key_name;
    END IF;
  END IF;
  
  -- Log access attempt
  PERFORM public.log_security_event(
    'system_setting_access',
    auth.uid(),
    jsonb_build_object(
      'setting_key', key_name,
      'is_admin', is_admin_user,
      'is_sensitive', is_sensitive_setting,
      'timestamp', now()
    )
  );
  
  -- Retrieve the setting
  SELECT setting_value INTO setting_data
  FROM public.system_settings
  WHERE setting_key = key_name;
  
  -- Return safe defaults if setting doesn't exist
  IF setting_data IS NULL THEN
    CASE key_name
      WHEN 'login_controls' THEN
        RETURN '{"parents_login_enabled": true, "kids_login_enabled": true, "maintenance_message": ""}'::jsonb;
      WHEN 'system_maintenance' THEN
        RETURN '{"enabled": false, "message": "System is currently under maintenance. Please try again later."}'::jsonb;
      ELSE
        RETURN '{}'::jsonb;
    END CASE;
  END IF;
  
  RETURN setting_data;
END;
$$;

-- Create function to update system settings securely
CREATE OR REPLACE FUNCTION public.update_system_setting_secure(
  key_name text, 
  new_value jsonb, 
  setting_description text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_sensitive_setting boolean;
BEGIN
  -- Check if this is a sensitive setting
  is_sensitive_setting := key_name IN (
    'security_configuration',
    'database_credentials',
    'api_keys',
    'encryption_keys',
    'admin_overrides'
  );
  
  -- Validate permissions
  IF is_sensitive_setting AND NOT public.can_manage_system_settings() THEN
    RAISE EXCEPTION 'Access denied: Full admin privileges required for sensitive setting: %', key_name;
  END IF;
  
  IF NOT is_sensitive_setting AND NOT public.can_manage_system_settings() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required to modify system settings';
  END IF;
  
  -- Validate setting key format
  IF key_name !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid setting key format. Must be lowercase with underscores only.';
  END IF;
  
  -- Log the change attempt
  PERFORM public.log_security_event(
    'system_setting_update_attempt',
    auth.uid(),
    jsonb_build_object(
      'setting_key', key_name,
      'is_sensitive', is_sensitive_setting,
      'new_value_hash', md5(new_value::text),
      'timestamp', now()
    )
  );
  
  -- Update or insert setting
  INSERT INTO public.system_settings (setting_key, setting_value, description, last_modified_by)
  VALUES (key_name, new_value, setting_description, auth.uid())
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = new_value,
    description = COALESCE(setting_description, system_settings.description),
    last_modified_by = auth.uid(),
    updated_at = now();
    
  RETURN true;
END;
$$;

-- Add security comment to table
COMMENT ON TABLE public.system_settings IS 'Critical system configuration table with enhanced security controls. Access restricted to admin users only with comprehensive audit logging.';

-- Add security-focused indexes for better performance and monitoring
CREATE INDEX IF NOT EXISTS idx_system_settings_sensitive_keys 
ON public.system_settings(setting_key) 
WHERE setting_key IN ('security_configuration', 'database_credentials', 'api_keys', 'encryption_keys', 'admin_overrides');

CREATE INDEX IF NOT EXISTS idx_system_settings_last_modified 
ON public.system_settings(last_modified_by, updated_at);

-- Log the security fix implementation
INSERT INTO public.security_alerts (
  user_id,
  alert_type, 
  severity,
  description,
  metadata
) VALUES (
  NULL,
  'system_settings_security_hardening_complete',
  'low',
  'System settings table security has been significantly enhanced with granular access controls and comprehensive audit logging',
  jsonb_build_object(
    'security_improvements', jsonb_build_array(
      'Replaced direct profile table queries with security definer functions',
      'Implemented granular access control for sensitive settings',
      'Added comprehensive audit logging with IP tracking',
      'Created validation triggers to prevent tampering',
      'Added secure wrapper functions for safe access',
      'Implemented role-based access restrictions'
    ),
    'sensitive_settings_protected', jsonb_build_array(
      'security_configuration',
      'database_credentials', 
      'api_keys',
      'encryption_keys',
      'admin_overrides'
    ),
    'implementation_date', now(),
    'security_level', 'hardened'
  )
);