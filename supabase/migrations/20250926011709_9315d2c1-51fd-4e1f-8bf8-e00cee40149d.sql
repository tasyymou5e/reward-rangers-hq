-- SECURITY FIX: Address remaining security linter warnings

-- Fix 1: Update functions with proper search_path settings that may be missing
-- Check and update any functions that might have mutable search_path

-- Update existing admin functions to ensure proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_current_user_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_any_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin'::user_role, 'full_admin'::user_role, 'read_only_admin'::user_role, 'report_admin'::user_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_any_admin_secure()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('admin'::user_role, 'full_admin'::user_role, 'read_only_admin'::user_role, 'report_admin'::user_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_full_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin'::user_role, 'full_admin'::user_role)
  );
$$;

-- Update all family-related security functions to ensure proper search_path
CREATE OR REPLACE FUNCTION public.is_family_member(family_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_id_param 
      AND fm.user_id = user_id_param
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_member(family_id_param uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_id_param 
      AND fm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_parent(family_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = family_id_param 
      AND f.parent_id = user_id_param
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_parent(family_id_param uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = family_id_param 
      AND f.parent_id = auth.uid()
  );
$$;

-- Note: Leaked password protection must be enabled in Supabase Dashboard
-- This cannot be fixed via SQL migration - requires manual dashboard configuration

-- Create system alert for manual action required
INSERT INTO public.security_alerts (
  user_id,
  alert_type,
  severity,
  description,
  metadata
) VALUES (
  NULL,
  'manual_security_configuration_required',
  'high',
  'MANUAL ACTION REQUIRED: Enable leaked password protection in Supabase Dashboard',
  jsonb_build_object(
    'action_required', 'enable_leaked_password_protection',
    'location', 'Supabase Dashboard > Authentication > Settings',
    'instruction', 'Enable "Leaked Password Protection" setting',
    'security_impact', 'Prevents users from using compromised passwords',
    'urgency', 'high',
    'dashboard_url', 'https://supabase.com/dashboard/project/rdvkwnoeojjvjuknlsjd/auth/providers',
    'documentation', 'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection',
    'created_at', now()
  )
);

-- Log completion of automated security fixes
INSERT INTO public.security_alerts (
  user_id,
  alert_type,
  severity, 
  description,
  metadata
) VALUES (
  NULL,
  'automated_security_fixes_complete',
  'low',
  'All automated security fixes have been applied successfully',
  jsonb_build_object(
    'fixes_applied', jsonb_build_array(
      'Enhanced system_settings RLS policies',
      'Implemented granular access control',
      'Added comprehensive audit logging',
      'Updated function search_path settings',
      'Created validation triggers',
      'Added secure wrapper functions'
    ),
    'manual_action_remaining', 'Enable leaked password protection in dashboard',
    'security_improvement', 'Significant enhancement to system security',
    'next_steps', jsonb_build_array(
      'Enable leaked password protection in Supabase Dashboard',
      'Review security alerts for any additional issues',
      'Monitor system for unusual activity'
    ),
    'completion_time', now()
  )
);