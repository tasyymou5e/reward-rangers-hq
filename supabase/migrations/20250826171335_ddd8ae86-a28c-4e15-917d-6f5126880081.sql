-- Fix the search path warning for the audit function
CREATE OR REPLACE FUNCTION public.audit_safe_profiles_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access attempts to the secure profiles view
  INSERT INTO public.security_alerts (
    user_id,
    alert_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'profile_data_access',
    'info',
    'User accessed safe profiles data',
    jsonb_build_object(
      'access_time', now(),
      'user_role', (SELECT role FROM public.profiles WHERE id = auth.uid()),
      'access_method', 'safe_profiles_secure_view'
    )
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;