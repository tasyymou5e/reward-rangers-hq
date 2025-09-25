-- Fix existing policy conflicts and create notification management system
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Create notification preferences and internal identifiers tables
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  consolidate_to_primary BOOLEAN DEFAULT true,
  delegation_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  recipient_type TEXT NOT NULL DEFAULT 'primary_parent',
  recipient_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS internal_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  internal_username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  identifier_type TEXT NOT NULL DEFAULT 'child',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(family_id, internal_username)
);

-- Add columns to notifications if they don't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS consolidated BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS routing_info JSONB DEFAULT '{}'::jsonb;

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_identifiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Family parents can manage notification preferences" ON notification_preferences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND f.parent_id = auth.uid())
    OR is_admin()
  );

-- RLS Policies for notification_routing  
CREATE POLICY "Family parents can manage notification routing" ON notification_routing
  FOR ALL USING (
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND f.parent_id = auth.uid())
    OR is_admin()
  );

-- RLS Policies for internal_identifiers
CREATE POLICY "Family members can view internal identifiers" ON internal_identifiers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM family_members fm WHERE fm.family_id = internal_identifiers.family_id AND fm.user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Family parents can manage internal identifiers" ON internal_identifiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND f.parent_id = auth.uid())
    OR is_admin()
  );

-- Enhanced RLS Policies for notifications 
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Family parents can view family notifications" ON notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND f.parent_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());