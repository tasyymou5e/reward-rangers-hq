-- Create families for existing users and link them properly
-- First, create families for the parent users

-- Create family for parent 1
INSERT INTO families (name, parent_id, family_code)
VALUES ('Smith Family', 'f18bd394-44f3-4905-af29-9f6006364f92', 'FAM00001');

-- Create family for parent 2 
INSERT INTO families (name, parent_id, family_code)
VALUES ('Johnson Family', 'f2bb4f2d-de44-40db-9faf-3606283a07e2', 'FAM00002');

-- Add parents to their own families as members
INSERT INTO family_members (family_id, user_id)
SELECT f.id, f.parent_id
FROM families f
WHERE f.parent_id IN ('f18bd394-44f3-4905-af29-9f6006364f92', 'f2bb4f2d-de44-40db-9faf-3606283a07e2');

-- Add the child to the second family (Johnson Family)
INSERT INTO family_members (family_id, user_id)
SELECT f.id, '85de6778-78c5-4fde-9ec1-eb2421ec0009'
FROM families f
WHERE f.parent_id = 'f2bb4f2d-de44-40db-9faf-3606283a07e2';

-- Create profiles for all users if they don't exist
INSERT INTO profiles (id, username, display_name, email, role)
VALUES 
  ('f18bd394-44f3-4905-af29-9f6006364f92', 'parent1', 'Parent One', 'parent+1756343105696@wccgroup.net', 'parent'),
  ('ed030cb5-1e50-4941-a24a-5ece7b012d27', 'admin', 'Eric Admin', 'eric@wccgroup.net', 'admin'),
  ('f2bb4f2d-de44-40db-9faf-3606283a07e2', 'dad', 'Dad Johnson', 'dad+1758852745947@wccgroup.net', 'parent'),
  ('85de6778-78c5-4fde-9ec1-eb2421ec0009', 'kid1', 'Kid One', 'kid1+1758852745947@wccgroup.net', 'kid')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;