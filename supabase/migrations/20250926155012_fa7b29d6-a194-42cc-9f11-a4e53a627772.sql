-- Fix Behavioral Patterns Access Control
-- Remove the overly permissive "System can manage behavioral patterns" policy
-- and replace it with proper admin and service role restrictions

-- Drop the problematic overly permissive policy
DROP POLICY IF EXISTS "System can manage behavioral patterns" ON behavioral_patterns;

-- Create a more restrictive policy for admin and system management
-- Using existing admin checking functions instead of non-existent app_role enum
CREATE POLICY "Admin and system can manage behavioral patterns" 
ON behavioral_patterns FOR ALL 
USING (
  -- Allow admins to manage all behavioral patterns
  is_admin() OR 
  -- Allow service role (for system operations) - identified by NULL auth.uid()
  auth.uid() IS NULL
)
WITH CHECK (
  -- Same conditions for insert/update operations
  is_admin() OR 
  auth.uid() IS NULL
);

-- Also ensure we have a policy for automated system inserts with proper user_id
CREATE POLICY "System can insert behavioral patterns for users" 
ON behavioral_patterns FOR INSERT 
WITH CHECK (
  -- Allow system/service role to insert with any user_id when auth.uid() is NULL
  auth.uid() IS NULL OR
  -- Allow admins to insert patterns
  is_admin()
);