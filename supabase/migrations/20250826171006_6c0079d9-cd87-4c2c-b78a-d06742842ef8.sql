-- Fix critical security vulnerability: Enable RLS and add policies for safe_profiles table
-- This table contains sensitive user data and was completely unprotected

-- First, enable Row Level Security on the safe_profiles table
ALTER TABLE public.safe_profiles ENABLE ROW LEVEL SECURITY;

-- Add policy to deny all anonymous access
CREATE POLICY "Deny anonymous access to safe profiles" 
ON public.safe_profiles 
FOR ALL 
TO anon 
USING (false);

-- Add policy for authenticated users to view their own safe profile
CREATE POLICY "Users can view their own safe profile" 
ON public.safe_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Add policy for authenticated users to update their own safe profile
CREATE POLICY "Users can update their own safe profile" 
ON public.safe_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add policy for parents to view their children's safe profiles (following the pattern from other tables)
CREATE POLICY "Parents can view their children safe profiles" 
ON public.safe_profiles 
FOR SELECT 
TO authenticated 
USING (EXISTS (
  SELECT 1 
  FROM families f, family_members fm 
  WHERE f.parent_id = auth.uid() 
    AND fm.family_id = f.id 
    AND fm.user_id = safe_profiles.id
));

-- Add policy for family members to view each other's basic safe profiles
CREATE POLICY "Family members can view safe profiles" 
ON public.safe_profiles 
FOR SELECT 
TO authenticated 
USING (EXISTS (
  SELECT 1 
  FROM family_members fm1, family_members fm2 
  WHERE fm1.user_id = auth.uid() 
    AND fm2.user_id = safe_profiles.id 
    AND fm1.family_id = fm2.family_id
));

-- Add admin access policy
CREATE POLICY "Admins can manage safe profiles" 
ON public.safe_profiles 
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 
  FROM profiles 
  WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
));

-- Add security logging for any violations
CREATE OR REPLACE FUNCTION log_safe_profiles_violation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.log_security_violation(
    'unauthorized_access_attempt',
    'safe_profiles',
    auth.uid(),
    jsonb_build_object(
      'attempted_action', TG_OP,
      'target_profile_id', COALESCE(NEW.id, OLD.id),
      'timestamp', now()
    )
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The safe_profiles table appears to be a duplicate of the profiles table
-- Consider removing this table entirely if it's not needed, as the profiles table
-- already has proper security policies and the same data structure