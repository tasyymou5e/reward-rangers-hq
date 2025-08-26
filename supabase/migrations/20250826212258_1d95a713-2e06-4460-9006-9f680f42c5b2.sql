-- Add admin policies to view all data in admin portal

-- Allow admins to view all profiles  
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'::user_role
  )
);

-- Allow admins to view all families
CREATE POLICY "Admins can view all families" 
ON public.families 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'::user_role
  )
);

-- Allow admins to view all family members
CREATE POLICY "Admins can view all family members" 
ON public.family_members 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'::user_role
  )
);

-- Allow admins to view all chores
CREATE POLICY "Admins can view all chores" 
ON public.chores 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'::user_role
  )
);

-- Allow admins to view all progress logs
CREATE POLICY "Admins can view all progress logs" 
ON public.progress_logs 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'::user_role
  )
);