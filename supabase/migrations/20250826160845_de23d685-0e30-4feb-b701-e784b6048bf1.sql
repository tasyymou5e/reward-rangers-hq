-- Query to find functions without proper search_path
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosrc AS source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND p.prosrc NOT LIKE '%SET search_path%'
  AND p.proname IN (
    'handle_new_user',
    'assign_user_to_ab_tests', 
    'update_updated_at_column'
  );