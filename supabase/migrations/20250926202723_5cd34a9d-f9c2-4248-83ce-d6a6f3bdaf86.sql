-- Fix the is_admin_enhanced function to work properly with current session
CREATE OR REPLACE FUNCTION public.is_admin_enhanced()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if there's an authenticated user
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check the user's role from auth.users metadata
  RETURN EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() 
    AND (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
  );
END;
$$;

-- Also create a simpler fallback function
CREATE OR REPLACE FUNCTION public.check_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT (u.raw_user_meta_data->>'role') IN ('admin', 'full_admin', 'read_only_admin', 'report_admin') 
     FROM auth.users u 
     WHERE u.id = auth.uid()),
    false
  );
$$;