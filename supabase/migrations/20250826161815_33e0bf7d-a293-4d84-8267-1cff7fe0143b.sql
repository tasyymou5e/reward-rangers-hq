-- Enable RLS on the safe_profiles view to protect children's data
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- Enable RLS on the view
ALTER VIEW public.safe_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own safe profile" 
ON public.safe_profiles 
FOR SELECT 
USING (id = auth.uid());

-- Policy 2: Family members can view each other's safe profiles
CREATE POLICY "Family members can view safe profiles" 
ON public.safe_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM family_members fm1, family_members fm2
    WHERE fm1.user_id = auth.uid() 
      AND fm2.user_id = safe_profiles.id 
      AND fm1.family_id = fm2.family_id
  )
);

-- Policy 3: Parents can view their family members' safe profiles
CREATE POLICY "Parents can view family safe profiles" 
ON public.safe_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM families f, family_members fm
    WHERE f.parent_id = auth.uid() 
      AND fm.family_id = f.id 
      AND fm.user_id = safe_profiles.id
  )
);