-- Create function to check if user has full admin privileges
CREATE OR REPLACE FUNCTION public.is_full_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin'::user_role, 'full_admin'::user_role)
  );
$function$

-- Create function to check if user can generate reports
CREATE OR REPLACE FUNCTION public.can_generate_reports()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin'::user_role, 'full_admin'::user_role, 'report_admin'::user_role)
  );
$function$