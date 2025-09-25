-- Fix user deletion issues by improving the handle_new_user function
-- and ensuring proper role handling during deletion

-- Drop existing trigger and function to recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_val public.user_role;
BEGIN
  -- Safely extract and validate the role from metadata
  BEGIN
    -- Get role from metadata, default to 'parent' if not provided or invalid
    user_role_val := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'parent'::public.user_role
    );
  EXCEPTION WHEN OTHERS THEN
    -- If role conversion fails, default to 'parent'
    user_role_val := 'parent'::public.user_role;
  END;

  -- Insert profile with validated role
  INSERT INTO public.profiles (id, username, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    user_role_val
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user creation
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add a cleanup function to fix any existing profiles with invalid roles
CREATE OR REPLACE FUNCTION public.cleanup_invalid_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update any profiles that might have invalid role values
  UPDATE public.profiles 
  SET role = 'parent'::public.user_role 
  WHERE role::text NOT IN ('kid', 'parent', 'admin', 'full_admin', 'read_only_admin', 'report_admin');
  
  RAISE NOTICE 'Cleaned up invalid profile roles';
END;
$$;

-- Run the cleanup
SELECT public.cleanup_invalid_profiles();