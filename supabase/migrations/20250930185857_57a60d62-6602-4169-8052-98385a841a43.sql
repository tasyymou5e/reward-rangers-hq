-- Fix infinite recursion in admin_role_permissions RLS policies
-- The issue: policies were querying the same table they protect, causing recursion

-- Drop all problematic policies first
DROP POLICY IF EXISTS "Full admins can manage permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Admins can view role permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Security admins can view audit trail" ON security_audit_trail;
DROP POLICY IF EXISTS "System can insert audit records" ON security_audit_trail;
DROP POLICY IF EXISTS "Admins can view bulk operations" ON bulk_operations;
DROP POLICY IF EXISTS "Admins can create bulk operations" ON bulk_operations;
DROP POLICY IF EXISTS "Admins can update bulk operations" ON bulk_operations;

-- Create security definer function to check admin permissions without recursion
CREATE OR REPLACE FUNCTION public.has_admin_permission_safe(
  p_user_id UUID,
  p_permission admin_permission
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is a full admin first (bypasses permission check)
  IF EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = p_user_id 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission (this query is safe inside a security definer function)
  RETURN EXISTS (
    SELECT 1 FROM admin_role_permissions arp
    WHERE arp.user_id = p_user_id 
      AND arp.permission = p_permission
      AND (arp.expires_at IS NULL OR arp.expires_at > now())
  );
END;
$$;

-- Create safe admin check function
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
  );
END;
$$;

-- Recreate admin_role_permissions policies using security definer functions
CREATE POLICY "Admins can view all permissions"
ON admin_role_permissions FOR SELECT
USING (is_admin_safe());

CREATE POLICY "Full admins can manage permissions"
ON admin_role_permissions FOR ALL
USING (has_admin_permission_safe(auth.uid(), 'manage_users'))
WITH CHECK (has_admin_permission_safe(auth.uid(), 'manage_users'));

-- Fix security_audit_trail policies
CREATE POLICY "Security admins can view audit trail"
ON security_audit_trail FOR SELECT
USING (
  has_admin_permission_safe(auth.uid(), 'view_security_logs')
  OR is_admin_safe()
);

CREATE POLICY "System can insert audit records"
ON security_audit_trail FOR INSERT
WITH CHECK (true);

-- Fix bulk_operations policies
CREATE POLICY "Admins can view bulk operations"
ON bulk_operations FOR SELECT
USING (
  has_admin_permission_safe(auth.uid(), 'bulk_operations')
  OR is_admin_safe()
);

CREATE POLICY "Admins can create bulk operations"
ON bulk_operations FOR INSERT
WITH CHECK (
  initiated_by = auth.uid() AND
  (has_admin_permission_safe(auth.uid(), 'bulk_operations') OR is_admin_safe())
);

CREATE POLICY "Admins can update bulk operations"
ON bulk_operations FOR UPDATE
USING (
  has_admin_permission_safe(auth.uid(), 'bulk_operations')
  OR is_admin_safe()
);

-- Add helpful comments
COMMENT ON FUNCTION public.has_admin_permission_safe IS 
'Security definer function to check admin permissions without RLS recursion. Uses auth.users metadata for admin checks.';

COMMENT ON FUNCTION public.is_admin_safe IS 
'Security definer function to check if user is any type of admin. Prevents RLS recursion by using auth.users directly.';