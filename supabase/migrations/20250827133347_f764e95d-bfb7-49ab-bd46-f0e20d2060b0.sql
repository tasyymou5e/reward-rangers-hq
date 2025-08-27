-- Add new admin role types to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'full_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'read_only_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'report_admin';

-- Create function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin'::user_role, 'full_admin'::user_role, 'read_only_admin'::user_role, 'report_admin'::user_role)
  );
$function$

-- Create function to check if user has full admin privileges
CREATE OR REPLACE FUNCTION public.is_full_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin'::user_role, 'full_admin'::user_role)
  );
$function$

-- Create function to check if user can generate reports
CREATE OR REPLACE FUNCTION public.can_generate_reports()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin'::user_role, 'full_admin'::user_role, 'report_admin'::user_role)
  );
$function$

-- Update existing admin policies to use the new functions
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_any_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Full admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (((auth.uid() = id) OR is_full_admin()))
WITH CHECK (((auth.uid() = id) OR is_full_admin()));

-- Update other admin policies for read-only restrictions
DROP POLICY IF EXISTS "Admins can view all families" ON public.families;
CREATE POLICY "Admins can view all families" 
ON public.families 
FOR SELECT 
USING (is_any_admin());

DROP POLICY IF EXISTS "Parents can manage their families" ON public.families;
CREATE POLICY "Parents and full admins can manage families" 
ON public.families 
FOR ALL 
USING (((parent_id = auth.uid()) OR is_full_admin()))
WITH CHECK (((parent_id = auth.uid()) OR is_full_admin()));

-- Update family members policies
DROP POLICY IF EXISTS "Admins can view all family members" ON public.family_members;
CREATE POLICY "Admins can view all family members" 
ON public.family_members 
FOR SELECT 
USING (is_any_admin());

DROP POLICY IF EXISTS "Parents can manage family membership" ON public.family_members;
CREATE POLICY "Parents and full admins can manage family membership" 
ON public.family_members 
FOR ALL 
USING ((is_family_parent(family_id) OR is_full_admin()))
WITH CHECK ((is_family_parent(family_id) OR is_full_admin()));

-- Update chores policies
DROP POLICY IF EXISTS "Admins can view all chores" ON public.chores;
CREATE POLICY "Admins can view all chores" 
ON public.chores 
FOR SELECT 
USING (is_any_admin());

-- Update progress logs policies
DROP POLICY IF EXISTS "Admins can view all progress logs" ON public.progress_logs;
CREATE POLICY "Admins can view all progress logs" 
ON public.progress_logs 
FOR SELECT 
USING (is_any_admin());

-- Update security alerts policies
DROP POLICY IF EXISTS "Admins can view security alerts" ON public.security_alerts;
CREATE POLICY "Admins can view security alerts" 
ON public.security_alerts 
FOR SELECT 
USING (is_any_admin());

DROP POLICY IF EXISTS "Admins can manage security alerts" ON public.security_alerts;
CREATE POLICY "Full admins can manage security alerts" 
ON public.security_alerts 
FOR UPDATE 
USING (is_full_admin());

-- Update user feedback policies
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.user_feedback;
CREATE POLICY "Admins can view all feedback" 
ON public.user_feedback 
FOR SELECT 
USING (is_any_admin());

DROP POLICY IF EXISTS "Admins can manage feedback" ON public.user_feedback;
CREATE POLICY "Full admins can manage feedback" 
ON public.user_feedback 
FOR ALL 
USING (is_full_admin());

-- Update A/B test policies
DROP POLICY IF EXISTS "Admins can manage A/B tests" ON public.ab_tests;
CREATE POLICY "Full admins can manage A/B tests" 
ON public.ab_tests 
FOR ALL 
USING (is_full_admin());

DROP POLICY IF EXISTS "Admins can manage assignments" ON public.ab_test_assignments;
CREATE POLICY "Full admins can manage assignments" 
ON public.ab_test_assignments 
FOR ALL 
USING (is_full_admin());

-- Update affiliates policies
DROP POLICY IF EXISTS "Only admins can manage affiliates" ON public.approved_affiliates;
CREATE POLICY "Only full admins can manage affiliates" 
ON public.approved_affiliates 
FOR ALL 
USING (is_full_admin());

-- Update MFA audit log policies
DROP POLICY IF EXISTS "Admins can view MFA audit logs" ON public.mfa_audit_log;
CREATE POLICY "Admins can view MFA audit logs" 
ON public.mfa_audit_log 
FOR SELECT 
USING (is_any_admin());