-- Phase 1: Primary Email Designator System - Database Schema Changes

-- Create family_role enum for better role management
CREATE TYPE family_role AS ENUM ('primary_parent', 'co_parent', 'child', 'guardian');

-- Add primary_email_designator to families table
ALTER TABLE families 
ADD COLUMN primary_email_designator TEXT,
ADD COLUMN email_domain TEXT GENERATED ALWAYS AS (split_part(primary_email_designator, '@', 2)) STORED,
ADD COLUMN created_by_primary_email BOOLEAN DEFAULT true;

-- Create email_aliases table for managing family member emails
CREATE TABLE email_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    alias_email TEXT NOT NULL,
    primary_email TEXT NOT NULL,
    role family_role NOT NULL DEFAULT 'child',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(alias_email),
    UNIQUE(user_id, family_id)
);

-- Enable RLS on email_aliases
ALTER TABLE email_aliases ENABLE ROW LEVEL SECURITY;

-- Create policies for email_aliases
CREATE POLICY "Family members can view family email aliases"
ON email_aliases FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM family_members fm 
        WHERE fm.family_id = email_aliases.family_id 
        AND fm.user_id = auth.uid()
    )
);

CREATE POLICY "Primary parents can manage email aliases"
ON email_aliases FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM families f 
        WHERE f.id = email_aliases.family_id 
        AND f.parent_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all email aliases"
ON email_aliases FOR ALL
USING (is_admin());

-- Create function to resolve email to primary designator
CREATE OR REPLACE FUNCTION resolve_to_primary_email(input_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    primary_email TEXT;
BEGIN
    -- Check if email is already a primary designator
    SELECT primary_email_designator INTO primary_email
    FROM families
    WHERE primary_email_designator = input_email;
    
    IF primary_email IS NOT NULL THEN
        RETURN primary_email;
    END IF;
    
    -- Check if email is an alias
    SELECT ea.primary_email INTO primary_email
    FROM email_aliases ea
    WHERE ea.alias_email = input_email AND ea.is_active = true;
    
    IF primary_email IS NOT NULL THEN
        RETURN primary_email;
    END IF;
    
    -- If not found, return the input email (for backward compatibility)
    RETURN input_email;
END;
$$;

-- Create function to get family by any email (primary or alias)
CREATE OR REPLACE FUNCTION get_family_by_email(input_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    family_uuid UUID;
    resolved_email TEXT;
BEGIN
    resolved_email := resolve_to_primary_email(input_email);
    
    SELECT id INTO family_uuid
    FROM families
    WHERE primary_email_designator = resolved_email;
    
    RETURN family_uuid;
END;
$$;

-- Create trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION update_email_aliases_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_aliases_updated_at
    BEFORE UPDATE ON email_aliases
    FOR EACH ROW
    EXECUTE FUNCTION update_email_aliases_timestamp();

-- Add indexes for performance
CREATE INDEX idx_email_aliases_family_id ON email_aliases(family_id);
CREATE INDEX idx_email_aliases_alias_email ON email_aliases(alias_email);
CREATE INDEX idx_email_aliases_primary_email ON email_aliases(primary_email);
CREATE INDEX idx_families_primary_email ON families(primary_email_designator);

-- Create backup table for migration safety
CREATE TABLE families_backup AS SELECT * FROM families;
CREATE TABLE profiles_backup AS SELECT * FROM profiles;