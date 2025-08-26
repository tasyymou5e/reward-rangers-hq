-- Critical Security Fixes for ChoreQuest

-- 1. Fix approved_affiliates table - require authentication to view business partner data
DROP POLICY IF EXISTS "Everyone can view active affiliates" ON public.approved_affiliates;

CREATE POLICY "Authenticated users can view active affiliates" 
ON public.approved_affiliates 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- 2. Fix potential privilege escalation - prevent users from updating their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (excluding role)" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role changes unless user is admin
  (
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  )
);

-- 3. Fix badges table - require authentication to view gamification data
DROP POLICY IF EXISTS "Everyone can view badges" ON public.badges;

CREATE POLICY "Authenticated users can view badges" 
ON public.badges 
FOR SELECT 
TO authenticated
USING (true);

-- 4. Add security logging for role change attempts
CREATE OR REPLACE FUNCTION public.log_role_change_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log any role change attempts for security monitoring
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_security_event(
      'role_change_attempt',
      auth.uid(),
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user_id', NEW.id,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to monitor role changes
DROP TRIGGER IF EXISTS monitor_role_changes ON public.profiles;
CREATE TRIGGER monitor_role_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change_attempt();