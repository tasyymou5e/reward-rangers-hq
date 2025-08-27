-- CRITICAL SECURITY FIX: Enhanced Profile Data Protection
-- This migration implements mandatory email masking and secure profile access

-- 1. Create enhanced secure profile access function with mandatory email masking
CREATE OR REPLACE FUNCTION public.get_profiles_secure(requesting_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(
   id uuid, 
   username text, 
   display_name text, 
   email_masked text, 
   role user_role, 
   points integer, 
   level integer, 
   streak_days integer, 
   avatar_url text, 
   created_at timestamp with time zone, 
   last_activity timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate user is authenticated
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Log the access attempt with rate limiting
  PERFORM public.log_security_event_with_rate_limit(
    'profile_data_accessed',
    requesting_user_id,
    jsonb_build_object(
      'action', 'secure_profile_access',
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
  
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    -- CRITICAL: Always mask emails for privacy unless viewing own profile or admin
    CASE
      WHEN p.id = requesting_user_id THEN p.email
      WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = requesting_user_id AND role = 'admin'::user_role) THEN p.email
      ELSE CONCAT(LEFT(p.email, 2), '***@', SPLIT_PART(p.email, '@', 2))
    END AS email_masked,
    p.role,
    p.points,
    p.level,
    p.streak_days,
    p.avatar_url,
    p.created_at,
    p.last_activity
  FROM public.profiles p
  WHERE 
    requesting_user_id IS NOT NULL AND
    (
      -- User can see their own profile
      p.id = requesting_user_id 
      -- Family parents can see their children's profiles
      OR EXISTS (
        SELECT 1 FROM public.families f, public.family_members fm 
        WHERE f.parent_id = requesting_user_id 
          AND fm.family_id = f.id 
          AND fm.user_id = p.id
      )
      -- Family members can see each other's profiles (with masked emails)
      OR EXISTS (
        SELECT 1 FROM public.family_members fm1, public.family_members fm2 
        WHERE fm1.user_id = requesting_user_id 
          AND fm2.user_id = p.id 
          AND fm1.family_id = fm2.family_id
      )
      -- Admins can see all profiles
      OR EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = requesting_user_id 
          AND admin_profile.role = 'admin'::user_role
      )
    );
END;
$function$;

-- 2. Create function to get single profile securely
CREATE OR REPLACE FUNCTION public.get_profile_by_id_secure(target_user_id uuid, requesting_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(
   id uuid, 
   username text, 
   display_name text, 
   email_masked text, 
   role user_role, 
   points integer, 
   level integer, 
   streak_days integer, 
   avatar_url text, 
   created_at timestamp with time zone, 
   last_activity timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate user is authenticated
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Log the access attempt
  PERFORM public.log_security_event_with_rate_limit(
    'single_profile_accessed',
    requesting_user_id,
    jsonb_build_object(
      'target_user_id', target_user_id,
      'action', 'view_profile',
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
  
  RETURN QUERY
  SELECT * FROM public.get_profiles_secure(requesting_user_id)
  WHERE get_profiles_secure.id = target_user_id;
END;
$function$;

-- 3. Create restrictive RLS policies that force use of secure functions
-- First, drop all existing profile policies that might be permissive
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Family members can view safe profiles only" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view their children profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile (excluding role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 4. Create new restrictive policies
CREATE POLICY "Secure profile access only" ON public.profiles
FOR ALL USING (
  -- Only allow access through secure functions or for admins
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- 5. Enhanced MFA backup code security
CREATE OR REPLACE FUNCTION public.get_mfa_backup_codes_secure()
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  encrypted_codes text[];
  decrypted_codes text[];
  code text;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Log backup code access (high security event)
  PERFORM public.log_security_event_with_rate_limit(
    'mfa_backup_codes_accessed',
    auth.uid(),
    jsonb_build_object(
      'action', 'view_backup_codes',
      'timestamp', now(),
      'ip_address', inet_client_addr()::text,
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
  
  -- Get encrypted backup codes
  SELECT backup_codes INTO encrypted_codes
  FROM public.user_mfa_settings
  WHERE user_id = auth.uid();
  
  IF encrypted_codes IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;
  
  -- Decrypt each code
  decrypted_codes := ARRAY[]::text[];
  FOREACH code IN ARRAY encrypted_codes LOOP
    decrypted_codes := decrypted_codes || public.decrypt_mfa_secret_secure(code);
  END LOOP;
  
  RETURN decrypted_codes;
EXCEPTION
  WHEN OTHERS THEN
    -- Log failed access attempt
    PERFORM public.log_security_event(
      'mfa_backup_codes_access_failed',
      auth.uid(),
      jsonb_build_object(
        'error', SQLERRM,
        'timestamp', now(),
        'ip_address', inet_client_addr()::text
      )
    );
    RAISE EXCEPTION 'Failed to access backup codes: %', SQLERRM;
END;
$function$;

-- 6. Add email update validation with security logging
CREATE OR REPLACE FUNCTION public.update_profile_email_secure(new_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  old_email text;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Get current email
  SELECT email INTO old_email FROM public.profiles WHERE id = auth.uid();
  
  -- Validate email format
  IF new_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Log email change attempt
  PERFORM public.log_security_event_with_rate_limit(
    'email_change_attempt',
    auth.uid(),
    jsonb_build_object(
      'old_email_domain', SPLIT_PART(old_email, '@', 2),
      'new_email_domain', SPLIT_PART(new_email, '@', 2),
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
  
  -- Update profile email
  UPDATE public.profiles 
  SET email = new_email, updated_at = now()
  WHERE id = auth.uid();
  
  -- Log successful email change
  PERFORM public.log_security_event(
    'email_changed_successfully',
    auth.uid(),
    jsonb_build_object(
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
END;
$function$;

-- 7. Enhanced family data access with logging
CREATE OR REPLACE FUNCTION public.get_family_data_secure(family_id_param uuid, requesting_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(
   id uuid,
   name text,
   family_code text,
   parent_id uuid,
   created_at timestamp with time zone,
   updated_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate user is authenticated
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;
  
  -- Validate family access
  IF NOT (
    is_family_member(family_id_param, requesting_user_id) OR 
    is_family_parent(family_id_param, requesting_user_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = requesting_user_id AND role = 'admin'::user_role)
  ) THEN
    -- Log unauthorized access attempt
    PERFORM public.log_security_event(
      'unauthorized_family_access_attempt',
      requesting_user_id,
      jsonb_build_object(
        'family_id', family_id_param,
        'timestamp', now(),
        'ip_address', inet_client_addr()::text
      )
    );
    RAISE EXCEPTION 'Access denied: not a family member';
  END IF;
  
  -- Log family data access
  PERFORM public.log_security_event_with_rate_limit(
    'family_data_accessed',
    requesting_user_id,
    jsonb_build_object(
      'family_id', family_id_param,
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
  
  RETURN QUERY
  SELECT f.id, f.name, f.family_code, f.parent_id, f.created_at, f.updated_at
  FROM public.families f
  WHERE f.id = family_id_param;
END;
$function$;