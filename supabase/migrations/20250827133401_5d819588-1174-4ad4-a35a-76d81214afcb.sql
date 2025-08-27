-- Add new admin role types to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'full_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'read_only_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'report_admin';