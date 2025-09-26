-- Insert default invitation settings if they don't exist
INSERT INTO public.system_settings (setting_key, setting_value, description, last_modified_by)
VALUES (
  'invitation_settings',
  '{
    "external_invitations_enabled": true,
    "invitation_expiry_days": 7,
    "allowed_roles": ["parent", "kid"],
    "admin_approval_required": false
  }'::jsonb,
  'External family invitation system configuration',
  NULL
)
ON CONFLICT (setting_key) DO NOTHING;