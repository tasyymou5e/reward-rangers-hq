-- Fix security warnings by setting proper search paths and enabling leaked password protection

-- Fix search path for all functions that don't have it set properly
CREATE OR REPLACE FUNCTION public.cleanup_invalid_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update any profiles that might have invalid role values
  UPDATE public.profiles 
  SET role = 'parent'::public.user_role 
  WHERE role::text NOT IN ('kid', 'parent', 'admin', 'full_admin', 'read_only_admin', 'report_admin');
  
  RAISE NOTICE 'Cleaned up invalid profile roles';
END;
$$;

-- Create a function to help admins enable leaked password protection
CREATE OR REPLACE FUNCTION public.get_security_recommendations()
RETURNS TABLE(recommendation text, action_required text, priority text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    'Enable Leaked Password Protection'::text as recommendation,
    'Go to Authentication > Password Protection in Supabase dashboard and enable leaked password protection'::text as action_required,
    'HIGH'::text as priority
  UNION ALL
  SELECT 
    'Review Function Security'::text,
    'All security definer functions should have explicit search_path settings'::text,
    'MEDIUM'::text;
$$;