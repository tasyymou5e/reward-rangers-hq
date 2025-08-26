-- Phase 1: Fix Infinite Recursion in RLS Policies
-- Create security definer functions to break circular dependencies

-- Function to check if user is family parent
CREATE OR REPLACE FUNCTION public.is_family_parent(family_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.families 
    WHERE id = family_id_param AND parent_id = user_id_param
  );
$$;

-- Function to check if user is family member
CREATE OR REPLACE FUNCTION public.is_family_member(family_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_id = family_id_param AND user_id = user_id_param
  );
$$;

-- Function to get user's family IDs
CREATE OR REPLACE FUNCTION public.get_user_family_ids(user_id_param uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ARRAY(
    SELECT family_id FROM public.family_members 
    WHERE user_id = user_id_param
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Family members can view their family" ON public.families;
DROP POLICY IF EXISTS "Parents can manage their families" ON public.families;
DROP POLICY IF EXISTS "Family members can view family membership" ON public.family_members;
DROP POLICY IF EXISTS "Parents can manage family membership" ON public.family_members;

-- Create new secure policies for families table
CREATE POLICY "Family members can view their family" 
ON public.families 
FOR SELECT 
USING (public.is_family_member(id) OR parent_id = auth.uid());

CREATE POLICY "Parents can manage their families" 
ON public.families 
FOR ALL 
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- Create new secure policies for family_members table
CREATE POLICY "Family members can view family membership" 
ON public.family_members 
FOR SELECT 
USING (user_id = auth.uid() OR public.is_family_parent(family_id));

CREATE POLICY "Parents can manage family membership" 
ON public.family_members 
FOR ALL 
USING (public.is_family_parent(family_id))
WITH CHECK (public.is_family_parent(family_id));

-- Phase 2: Secure MFA Data Storage
-- First, let's add encryption for MFA settings
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create audit table for MFA operations
CREATE TABLE IF NOT EXISTS public.mfa_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.mfa_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view MFA audit logs" 
ON public.mfa_audit_log 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'::user_role
));

-- Function to encrypt sensitive MFA data
CREATE OR REPLACE FUNCTION public.encrypt_mfa_secret(secret_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
IMMUTABLE
AS $$
  SELECT encode(
    pgp_sym_encrypt(
      secret_text, 
      current_setting('app.mfa_encryption_key', true)
    ), 
    'base64'
  );
$$;

-- Function to decrypt sensitive MFA data
CREATE OR REPLACE FUNCTION public.decrypt_mfa_secret(encrypted_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT pgp_sym_decrypt(
    decode(encrypted_text, 'base64'), 
    current_setting('app.mfa_encryption_key', true)
  );
$$;

-- Phase 3: Fix Analytics Data Insertion
-- Drop overly permissive policy
DROP POLICY IF EXISTS "System can insert analytics" ON public.chore_analytics;

-- Create more restrictive policy for analytics
CREATE POLICY "Family members can insert their own analytics" 
ON public.chore_analytics 
FOR INSERT 
WITH CHECK (
  child_id = auth.uid() AND 
  public.is_family_member(family_id)
);

-- Phase 4: Improve Email Privacy
-- Update profiles table policies to limit email exposure
DROP POLICY IF EXISTS "Users can view family members profiles" ON public.profiles;

-- Create more restrictive profile viewing policy
CREATE POLICY "Users can view family members basic profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.family_members fm1, public.family_members fm2
    WHERE fm1.user_id = auth.uid() 
    AND fm2.user_id = profiles.id 
    AND fm1.family_id = fm2.family_id
  )
);

-- Create view for safe profile data sharing
CREATE OR REPLACE VIEW public.safe_profiles AS
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

-- Phase 5: Fix Database Function Security
-- Update existing functions with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'parent')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_user_to_ab_tests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ab_test_assignments (test_id, user_id, variant)
  SELECT 
    ab_tests.id,
    NEW.id,
    (ab_tests.variants->0->>'name')::TEXT
  FROM public.ab_tests
  WHERE ab_tests.active = true
    AND ab_tests.start_date <= now()
    AND (ab_tests.end_date IS NULL OR ab_tests.end_date > now())
  ON CONFLICT (test_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;