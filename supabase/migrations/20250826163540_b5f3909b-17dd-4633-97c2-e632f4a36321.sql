-- Phase 2b: Fix function dependencies by dropping and recreating policies

-- Drop policies that depend on functions we need to replace
DROP POLICY IF EXISTS "Family members can view family membership" ON public.family_members;
DROP POLICY IF EXISTS "Parents can manage family membership" ON public.family_members;

-- Now we can safely drop and recreate the functions
DROP FUNCTION IF EXISTS public.is_family_parent(uuid, uuid) CASCADE;
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

-- Recreate the policies with the new function
CREATE POLICY "Family members can view family membership" 
ON public.family_members 
FOR SELECT 
USING ((user_id = auth.uid()) OR is_family_parent(family_id));

CREATE POLICY "Parents can manage family membership" 
ON public.family_members 
FOR ALL 
USING (is_family_parent(family_id))
WITH CHECK (is_family_parent(family_id));