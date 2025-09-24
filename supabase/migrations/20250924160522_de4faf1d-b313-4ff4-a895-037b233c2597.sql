-- Create system_settings table for secure configuration management
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  last_modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access system settings
CREATE POLICY "Admins can manage system settings" 
ON public.system_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Insert default login control settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES 
('login_controls', '{"parents_login_enabled": true, "kids_login_enabled": true, "maintenance_message": ""}', 'Controls which user types can log in to the system'),
('system_maintenance', '{"enabled": false, "message": "System is currently under maintenance. Please try again later."}', 'System-wide maintenance mode settings');

-- Create function to get system setting
CREATE OR REPLACE FUNCTION public.get_system_setting(key_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  setting_data JSONB;
BEGIN
  SELECT setting_value INTO setting_data
  FROM public.system_settings
  WHERE setting_key = key_name;
  
  IF setting_data IS NULL THEN
    -- Return safe defaults if setting doesn't exist
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

-- Create function to update system setting (admin only)
CREATE OR REPLACE FUNCTION public.update_system_setting(
  key_name TEXT,
  new_value JSONB,
  setting_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Log the change attempt
  PERFORM public.log_security_event(
    'system_setting_update',
    auth.uid(),
    jsonb_build_object(
      'setting_key', key_name,
      'new_value', new_value,
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

-- Create audit trigger for system settings
CREATE OR REPLACE FUNCTION public.audit_system_settings_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_security_audit(
      'system_setting_updated',
      'system_settings',
      NEW.setting_key,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NULL,
      'high'
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_security_audit(
      'system_setting_created',
      'system_settings',
      NEW.setting_key,
      NULL,
      to_jsonb(NEW),
      NULL,
      'medium'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER system_settings_audit_trigger
  AFTER INSERT OR UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION audit_system_settings_changes();

-- Add updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();