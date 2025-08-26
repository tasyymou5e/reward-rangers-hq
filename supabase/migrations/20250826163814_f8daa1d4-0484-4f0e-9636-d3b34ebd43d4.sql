-- Phase 2d: Handle all function dependencies by dropping policies first

-- Drop all policies that depend on is_family_member function
DROP POLICY IF EXISTS "Family members can view their family" ON public.families;
DROP POLICY IF EXISTS "Family members can insert their own analytics" ON public.chore_analytics;

-- Drop policies that depend on validate_family_access function
DROP POLICY IF EXISTS "Family members can view analytics" ON public.chore_analytics;

-- Now drop and recreate the functions with proper search paths
DROP FUNCTION IF EXISTS public.is_family_member(uuid, uuid) CASCADE;
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

DROP FUNCTION IF EXISTS public.validate_family_access(uuid, uuid, text) CASCADE;
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

-- Recreate the dropped policies
CREATE POLICY "Family members can view their family" 
ON public.families 
FOR SELECT 
USING (is_family_member(id) OR (parent_id = auth.uid()));

CREATE POLICY "Family members can insert their own analytics" 
ON public.chore_analytics 
FOR INSERT 
WITH CHECK ((child_id = auth.uid()) AND is_family_member(family_id));

CREATE POLICY "Family members can view analytics" 
ON public.chore_analytics 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 
  FROM family_members fm
  WHERE fm.family_id = chore_analytics.family_id AND fm.user_id = auth.uid()
));