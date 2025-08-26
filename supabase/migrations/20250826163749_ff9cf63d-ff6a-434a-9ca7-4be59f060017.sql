-- Phase 2c: Complete remaining function fixes

-- Fix the remaining functions with mutable search paths
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