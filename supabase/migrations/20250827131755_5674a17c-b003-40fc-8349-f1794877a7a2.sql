-- Check and fix family deletion RLS policies
-- First, let's see what's blocking the family deletion

-- Update the family deletion policy to ensure admins can delete any family
DROP POLICY IF EXISTS "Parents can manage their families" ON public.families;

CREATE POLICY "Parents can manage their families" 
ON public.families 
FOR ALL 
USING (parent_id = auth.uid() OR is_admin())
WITH CHECK (parent_id = auth.uid() OR is_admin());

-- Also ensure family_members can be deleted by admins
DROP POLICY IF EXISTS "Parents can manage family membership" ON public.family_members;

CREATE POLICY "Parents can manage family membership" 
ON public.family_members 
FOR ALL 
USING (is_family_parent(family_id) OR is_admin())
WITH CHECK (is_family_parent(family_id) OR is_admin());

-- Add policy to allow admins to delete any profile
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (auth.uid() = id OR is_admin())
WITH CHECK (auth.uid() = id OR is_admin());