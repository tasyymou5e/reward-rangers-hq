-- Fix security issues from linter

-- Fix search_path for existing functions that need it
CREATE OR REPLACE FUNCTION update_email_aliases_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Enable RLS on backup tables
ALTER TABLE families_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_backup ENABLE ROW LEVEL SECURITY;

-- Create policies for backup tables (admin only access)
CREATE POLICY "Admins only access to families backup"
ON families_backup FOR ALL
USING (is_admin());

CREATE POLICY "Admins only access to profiles backup"  
ON profiles_backup FOR ALL
USING (is_admin());