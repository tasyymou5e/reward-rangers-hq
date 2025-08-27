-- Phase 1B: Enhanced admin role checking and security fixes
CREATE OR REPLACE FUNCTION public.is_any_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('admin'::user_role, 'full_admin'::user_role, 'read_only_admin'::user_role, 'report_admin'::user_role)
  );
$function$