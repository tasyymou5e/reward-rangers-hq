-- Fix Security Definer View Issue
-- Drop the view and recreate as a regular view
DROP VIEW IF EXISTS public.safe_profiles;

-- Create a regular view without SECURITY DEFINER
CREATE VIEW public.safe_profiles AS
SELECT 
  id,
  username,
  display_name,
  CASE 
    WHEN id = auth.uid() THEN email
    ELSE CONCAT(LEFT(email, 2), '***@', SPLIT_PART(email, '@', 2))
  END as email,
  role,
  points,
  level,
  streak_days,
  avatar_url,
  created_at,
  last_activity
FROM public.profiles;

-- Grant select on safe view
GRANT SELECT ON public.safe_profiles TO authenticated;

-- Fix function search_path issues for MFA encryption functions
CREATE OR REPLACE FUNCTION public.encrypt_mfa_secret(secret_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
IMMUTABLE
SET search_path = public
AS $$
  SELECT encode(
    pgp_sym_encrypt(
      secret_text, 
      current_setting('app.mfa_encryption_key', true)
    ), 
    'base64'
  );
$$;

CREATE OR REPLACE FUNCTION public.decrypt_mfa_secret(encrypted_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT pgp_sym_decrypt(
    decode(encrypted_text, 'base64'), 
    current_setting('app.mfa_encryption_key', true)
  );
$$;

-- Fix search_path for security helper functions
CREATE OR REPLACE FUNCTION public.is_family_parent(family_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.families 
    WHERE id = family_id_param AND parent_id = user_id_param
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_member(family_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_id = family_id_param AND user_id = user_id_param
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_family_ids(user_id_param uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT family_id FROM public.family_members 
    WHERE user_id = user_id_param
  );
$$;