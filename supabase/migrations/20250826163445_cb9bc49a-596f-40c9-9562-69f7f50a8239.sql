-- Phase 2: Fix remaining security definer functions and enhance monitoring

-- Fix remaining functions with mutable search paths
DROP FUNCTION IF EXISTS public.is_family_parent(uuid, uuid);
CREATE OR REPLACE FUNCTION public.is_family_parent(family_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.families 
    WHERE id = family_id_param AND parent_id = user_id_param
  );
$function$;

DROP FUNCTION IF EXISTS public.is_family_member(uuid, uuid);
CREATE OR REPLACE FUNCTION public.is_family_member(family_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_id = family_id_param AND user_id = user_id_param
  );
$function$;

DROP FUNCTION IF EXISTS public.get_user_family_ids(uuid);
CREATE OR REPLACE FUNCTION public.get_user_family_ids(user_id_param uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ARRAY(
    SELECT family_id FROM public.family_members 
    WHERE user_id = user_id_param
  );
$function$;

DROP FUNCTION IF EXISTS public.validate_family_access(uuid, uuid, text);
CREATE OR REPLACE FUNCTION public.validate_family_access(
  family_id_param uuid, 
  user_id_param uuid DEFAULT auth.uid(), 
  required_role text DEFAULT 'member'::text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN required_role = 'parent' THEN
      EXISTS (
        SELECT 1 FROM public.families 
        WHERE id = family_id_param AND parent_id = user_id_param
      )
    ELSE
      EXISTS (
        SELECT 1 FROM public.family_members 
        WHERE family_id = family_id_param AND user_id = user_id_param
      ) OR
      EXISTS (
        SELECT 1 FROM public.families 
        WHERE id = family_id_param AND parent_id = user_id_param
      )
  END;
$function$;

DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public', 'auth'
AS $function$
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
$function$;

DROP FUNCTION IF EXISTS public.assign_user_to_ab_tests();
CREATE OR REPLACE FUNCTION public.assign_user_to_ab_tests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_violation(
  violation_type text,
  table_name text,
  user_id_param uuid DEFAULT auth.uid(),
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log security violations
  INSERT INTO public.security_alerts (
    user_id,
    alert_type,
    severity,
    description,
    metadata
  ) VALUES (
    user_id_param,
    violation_type,
    'high',
    'Security violation detected on table: ' || table_name || ' - ' || violation_type,
    jsonb_build_object(
      'table_name', table_name,
      'violation_type', violation_type,
      'timestamp', now(),
      'user_role', COALESCE((SELECT role FROM public.profiles WHERE id = user_id_param), 'unknown')
    ) || metadata_param
  );
END;
$function$;