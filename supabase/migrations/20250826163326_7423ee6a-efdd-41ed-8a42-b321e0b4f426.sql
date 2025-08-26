-- Critical Security Fixes: Phase 1 - RLS Public Access Restrictions

-- 1. Add explicit public access denial policies for sensitive tables

-- Profiles table: Deny anonymous access to prevent email harvesting
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon 
USING (false);

-- Families table: Prevent public access to family codes
CREATE POLICY "Deny anonymous access to families" 
ON public.families 
FOR ALL 
TO anon 
USING (false);

-- User MFA settings: Block public access to MFA secrets
CREATE POLICY "Deny anonymous access to MFA settings" 
ON public.user_mfa_settings 
FOR ALL 
TO anon 
USING (false);

-- Family messages: Ensure family communications remain private
CREATE POLICY "Deny anonymous access to family messages" 
ON public.family_messages 
FOR ALL 
TO anon 
USING (false);

-- Family members: Prevent public access to family membership data
CREATE POLICY "Deny anonymous access to family members" 
ON public.family_members 
FOR ALL 
TO anon 
USING (false);

-- Chores: Prevent public access to family chore data
CREATE POLICY "Deny anonymous access to chores" 
ON public.chores 
FOR ALL 
TO anon 
USING (false);

-- Progress logs: Prevent public access to user progress
CREATE POLICY "Deny anonymous access to progress logs" 
ON public.progress_logs 
FOR ALL 
TO anon 
USING (false);

-- Rewards: Prevent public access to family rewards
CREATE POLICY "Deny anonymous access to rewards" 
ON public.rewards 
FOR ALL 
TO anon 
USING (false);

-- Motivation journal: Prevent public access to personal reflections
CREATE POLICY "Deny anonymous access to motivation journal" 
ON public.motivation_journal 
FOR ALL 
TO anon 
USING (false);

-- Chore analytics: Prevent public access to behavioral analytics
CREATE POLICY "Deny anonymous access to chore analytics" 
ON public.chore_analytics 
FOR ALL 
TO anon 
USING (false);

-- Family AI settings: Prevent public access to AI configurations
CREATE POLICY "Deny anonymous access to family AI settings" 
ON public.family_ai_settings 
FOR ALL 
TO anon 
USING (false);

-- Family reports: Prevent public access to family reports
CREATE POLICY "Deny anonymous access to family reports" 
ON public.family_reports 
FOR ALL 
TO anon 
USING (false);

-- User feedback: Prevent public access to user feedback
CREATE POLICY "Deny anonymous access to user feedback" 
ON public.user_feedback 
FOR ALL 
TO anon 
USING (false);

-- Security alerts: Prevent public access to security data
CREATE POLICY "Deny anonymous access to security alerts" 
ON public.security_alerts 
FOR ALL 
TO anon 
USING (false);

-- MFA audit log: Prevent public access to audit data
CREATE POLICY "Deny anonymous access to MFA audit log" 
ON public.mfa_audit_log 
FOR ALL 
TO anon 
USING (false);

-- User badges: Prevent public access to user achievements
CREATE POLICY "Deny anonymous access to user badges" 
ON public.user_badges 
FOR ALL 
TO anon 
USING (false);

-- AB test assignments: Prevent public access to test data
CREATE POLICY "Deny anonymous access to AB test assignments" 
ON public.ab_test_assignments 
FOR ALL 
TO anon 
USING (false);

-- AB tests: Prevent public access to test configurations
CREATE POLICY "Deny anonymous access to AB tests" 
ON public.ab_tests 
FOR ALL 
TO anon 
USING (false);

-- 2. Fix SECURITY DEFINER functions with mutable search paths

-- Replace encrypt_mfa_secret with secure version
DROP FUNCTION IF EXISTS public.encrypt_mfa_secret(text);
CREATE OR REPLACE FUNCTION public.encrypt_mfa_secret(secret_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- For now, use simple base64 encoding until encryption key is configured
  SELECT encode(secret_text::bytea, 'base64');
$function$;

-- Replace decrypt_mfa_secret with secure version
DROP FUNCTION IF EXISTS public.decrypt_mfa_secret(text);
CREATE OR REPLACE FUNCTION public.decrypt_mfa_secret(encoded_text text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- For now, use simple base64 decoding until encryption key is configured
  SELECT decode(encoded_text, 'base64')::text;
$function$;

-- Replace log_security_event with secure version
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, jsonb);
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text, 
  user_id_param uuid, 
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log to security alerts if it's suspicious
  IF event_type IN ('failed_login_attempt', 'suspicious_activity', 'data_access_violation', 'unauthorized_public_access') THEN
    INSERT INTO public.security_alerts (
      user_id,
      alert_type,
      severity,
      description,
      metadata
    ) VALUES (
      user_id_param,
      event_type,
      CASE 
        WHEN event_type = 'failed_login_attempt' THEN 'medium'
        WHEN event_type = 'data_access_violation' THEN 'high'
        WHEN event_type = 'unauthorized_public_access' THEN 'high'
        ELSE 'medium'
      END,
      'Security event detected: ' || event_type,
      metadata_param
    );
  END IF;
  
  -- Log to MFA audit if applicable
  IF event_type LIKE '%mfa%' THEN
    INSERT INTO public.mfa_audit_log (
      user_id,
      action,
      ip_address,
      user_agent,
      success
    ) VALUES (
      user_id_param,
      event_type,
      (metadata_param->>'ip_address')::inet,
      metadata_param->>'user_agent',
      COALESCE((metadata_param->>'success')::boolean, true)
    );
  END IF;
END;
$function$;