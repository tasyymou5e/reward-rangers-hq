-- Find all functions without proper search_path
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND p.proname NOT LIKE '_pg_%'
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_depend d 
    WHERE d.objid = p.oid 
    AND d.deptype = 'e'
  )
  AND prosrc NOT LIKE '%SET search_path%'
ORDER BY p.proname;

-- Let's check specifically which functions need search_path set
-- and update any remaining ones

-- First, let's see what we have
\df public.*