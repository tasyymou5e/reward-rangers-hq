-- Phase 2: Primary Email Designator System Implementation
-- This implements the database schema for transitioning to primary email-based family management

-- New enums for Primary Email System
CREATE TYPE family_member_type AS ENUM ('parent', 'co_parent', 'child', 'guardian');
CREATE TYPE email_route_type AS ENUM ('primary', 'family_member', 'shared');

-- Primary Email Designators table
-- This table maps families to their primary email addresses
CREATE TABLE family_email_designators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  primary_email TEXT NOT NULL UNIQUE,
  primary_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Family Member Email Aliases table  
-- This table manages email aliases for family members under the primary email
CREATE TABLE family_member_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alias_email TEXT NOT NULL, -- Generated: primary_email+child1@domain.com
  display_name TEXT NOT NULL,
  member_type family_member_type DEFAULT 'child',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, alias_email)
);

-- Email Routing Table
-- This table manages routing of incoming emails to appropriate family members
CREATE TABLE family_email_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incoming_email TEXT NOT NULL,
  family_id UUID REFERENCES families(id),
  target_user_id UUID REFERENCES auth.users(id),
  route_type email_route_type DEFAULT 'family_member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(incoming_email)
);

-- Add primary email designator reference to families table
ALTER TABLE families 
ADD COLUMN IF NOT EXISTS primary_email_designator_id UUID REFERENCES family_email_designators(id),
ADD COLUMN IF NOT EXISTS family_email_domain TEXT DEFAULT 'chatterbox.family';

-- Add email alias reference to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_alias TEXT,
ADD COLUMN IF NOT EXISTS is_primary_designator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_email_designator UUID REFERENCES family_email_designators(id);

-- Create indexes for performance
CREATE INDEX idx_family_email_designators_primary_email ON family_email_designators(primary_email);
CREATE INDEX idx_family_member_aliases_alias_email ON family_member_aliases(alias_email);
CREATE INDEX idx_family_email_routing_incoming_email ON family_email_routing(incoming_email);

-- Add updated_at triggers
CREATE TRIGGER update_family_email_designators_updated_at
BEFORE UPDATE ON family_email_designators
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_family_member_aliases_updated_at
BEFORE UPDATE ON family_member_aliases
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on new tables
ALTER TABLE family_email_designators ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_member_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_email_routing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_email_designators
CREATE POLICY "Admins can manage all email designators" 
ON family_email_designators FOR ALL 
USING (is_admin());

CREATE POLICY "Primary parents can manage their email designators" 
ON family_email_designators FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM families 
    WHERE families.id = family_email_designators.family_id 
    AND families.parent_id = auth.uid()
  )
);

CREATE POLICY "Family members can view email designators" 
ON family_email_designators FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    JOIN families f ON fm.family_id = f.id
    WHERE f.id = family_email_designators.family_id 
    AND fm.user_id = auth.uid()
  )
);

-- RLS Policies for family_member_aliases
CREATE POLICY "Admins can manage all member aliases" 
ON family_member_aliases FOR ALL 
USING (is_admin());

CREATE POLICY "Primary parents can manage family aliases" 
ON family_member_aliases FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM families 
    WHERE families.id = family_member_aliases.family_id 
    AND families.parent_id = auth.uid()
  )
);

CREATE POLICY "Family members can view family aliases" 
ON family_member_aliases FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_member_aliases.family_id 
    AND fm.user_id = auth.uid()
  )
);

-- RLS Policies for family_email_routing
CREATE POLICY "Admins can manage all email routing" 
ON family_email_routing FOR ALL 
USING (is_admin());

CREATE POLICY "Primary parents can manage family routing" 
ON family_email_routing FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM families 
    WHERE families.id = family_email_routing.family_id 
    AND families.parent_id = auth.uid()
  )
);

CREATE POLICY "Family members can view routing info" 
ON family_email_routing FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_email_routing.family_id 
    AND fm.user_id = auth.uid()
  )
);