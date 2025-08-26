-- Fix the three functions that lack search_path
-- These are the exact functions found by the security linter

-- Drop and recreate with proper search_path
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.assign_user_to_ab_tests() CASCADE;  
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Recreate handle_new_user with search_path
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

-- Recreate assign_user_to_ab_tests with search_path
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

-- Recreate update_updated_at_column with search_path
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

-- Recreate the trigger for new user handling
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();