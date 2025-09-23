-- Enhanced Admin Role System
CREATE TYPE admin_permission AS ENUM (
  'manage_users',
  'manage_families', 
  'view_security_logs',
  'manage_system_settings',
  'generate_reports',
  'bulk_operations'
);

CREATE TABLE admin_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission admin_permission NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, permission)
);

-- Enhanced Security Audit System
CREATE TABLE security_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  family_context UUID REFERENCES families(id),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Family Join Request System
CREATE TABLE family_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  approved_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Child Account Management
CREATE TABLE child_account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  password_policy JSONB DEFAULT '{"min_length": 6, "require_parent_approval": true}',
  screen_time_limits JSONB DEFAULT '{}',
  content_restrictions JSONB DEFAULT '{}',
  communication_settings JSONB DEFAULT '{"allow_family_chat": true, "moderated": true}',
  safety_settings JSONB DEFAULT '{"share_activity_with_parent": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(child_id)
);

-- Bulk Operations Tracking
CREATE TABLE bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,
  initiated_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  operation_data JSONB NOT NULL,
  results JSONB DEFAULT '{}',
  error_log TEXT[],
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_account_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admin Role Permissions
CREATE POLICY "Admins can view role permissions" ON admin_role_permissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

CREATE POLICY "Full admins can manage permissions" ON admin_role_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_role_permissions arp 
            WHERE arp.user_id = auth.uid() AND arp.permission = 'manage_users')
  );

-- RLS Policies for Security Audit Trail
CREATE POLICY "Security admins can view audit trail" ON security_audit_trail
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_role_permissions arp 
            WHERE arp.user_id = auth.uid() AND arp.permission = 'view_security_logs')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

CREATE POLICY "System can insert audit records" ON security_audit_trail
  FOR INSERT WITH CHECK (true);

-- RLS Policies for Family Join Requests
CREATE POLICY "Family parents can manage join requests" ON family_join_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND f.parent_id = auth.uid())
  );

CREATE POLICY "Users can view their own join requests" ON family_join_requests
  FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Users can create join requests" ON family_join_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- RLS Policies for Child Account Settings
CREATE POLICY "Parents can manage child settings" ON child_account_settings
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "Children can view their own settings" ON child_account_settings
  FOR SELECT USING (child_id = auth.uid());

-- RLS Policies for Bulk Operations
CREATE POLICY "Admins can view bulk operations" ON bulk_operations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_role_permissions arp 
            WHERE arp.user_id = auth.uid() AND arp.permission = 'bulk_operations')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

CREATE POLICY "Authorized users can create bulk operations" ON bulk_operations
  FOR INSERT WITH CHECK (
    initiated_by = auth.uid() AND
    (EXISTS (SELECT 1 FROM admin_role_permissions arp 
             WHERE arp.user_id = auth.uid() AND arp.permission = 'bulk_operations')
     OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role))
  );

-- Security Functions
CREATE OR REPLACE FUNCTION log_security_audit(
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_family_context UUID DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low',
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO security_audit_trail (
    user_id, action_type, resource_type, resource_id,
    old_values, new_values, ip_address, user_agent,
    family_context, risk_level, metadata
  ) VALUES (
    auth.uid(), p_action_type, p_resource_type, p_resource_id,
    p_old_values, p_new_values, inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    p_family_context, p_risk_level, p_metadata
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

CREATE OR REPLACE FUNCTION has_admin_permission(
  p_user_id UUID,
  p_permission admin_permission
) RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_role_permissions arp
    WHERE arp.user_id = p_user_id 
      AND arp.permission = p_permission
      AND (arp.expires_at IS NULL OR arp.expires_at > now())
  ) OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = p_user_id AND p.role = 'admin'::user_role
  );
$$;

-- Triggers for automatic audit logging
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_security_audit(
      'profile_updated',
      'profile',
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NULL,
      CASE WHEN OLD.role != NEW.role THEN 'high' ELSE 'low' END
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_audit(
      'profile_deleted',
      'profile', 
      OLD.id::text,
      to_jsonb(OLD),
      NULL,
      NULL,
      'high'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_profile_changes_trigger
  AFTER UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_profile_changes();

-- Add updated_at trigger to new tables
CREATE TRIGGER update_child_account_settings_updated_at
  BEFORE UPDATE ON child_account_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();