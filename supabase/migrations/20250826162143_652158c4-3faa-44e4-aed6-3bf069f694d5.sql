-- Add explicit policy for parents to view their children's profiles
-- This ensures parents can access their children's data through the safe_profiles view

CREATE POLICY "Parents can view their children profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM families f, family_members fm
    WHERE f.parent_id = auth.uid() 
      AND fm.family_id = f.id 
      AND fm.user_id = profiles.id
  )
);