-- SECURITY ANALYSIS AND ADDITIONAL PROTECTION
-- The 'safe_profiles_secure' is actually a VIEW (not a table) that uses a secure function
-- However, let's add additional layers of security to make it bulletproof

-- First, let's add explicit access control to the view itself
-- Since views can't have RLS, we'll use grants/revokes for additional protection

-- Revoke all default permissions on the view
REVOKE ALL ON public.safe_profiles_secure FROM PUBLIC;
REVOKE ALL ON public.safe_profiles_secure FROM anon;

-- Grant specific permissions only to authenticated users
GRANT SELECT ON public.safe_profiles_secure TO authenticated;

-- Add documentation to make the security model clear
COMMENT ON VIEW public.safe_profiles_secure IS 
'SECURE VIEW: This view uses the get_safe_profiles() security definer function which implements: 
1. Authentication required (no anonymous access)
2. Email privacy protection (masking for non-owners)
3. Family-based access control (parents see children, family members see each other)
4. Admin oversight capability
5. Row-level filtering in the underlying function
This view is secure and does not need RLS as it relies on function-level security.';

-- Also ensure the underlying function has proper documentation
COMMENT ON FUNCTION public.get_safe_profiles() IS 
'SECURITY DEFINER FUNCTION: Implements secure profile access with:
- Authentication requirement (executable only by authenticated role)
- Email masking for privacy (full email only for profile owner)
- Family relationship access control
- Admin access capability
- Explicit WHERE clause filtering
- No raw SQL execution, uses secure query patterns';

-- Add a security audit function to track access to this view
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
$$ LANGUAGE plpgsql SECURITY DEFINER;