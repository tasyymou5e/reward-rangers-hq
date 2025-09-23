import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdmin } from '@/hooks/useAdmin';

/**
 * Bridge adapter that provides admin functionality with proper context
 * This ensures backward compatibility while using proper admin authentication
 */
export function useAdminBridge() {
  const adminAuth = useAdminAuth();
  const admin = useAdmin();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set loading state based on admin auth loading state
    setIsLoading(adminAuth.loading);
  }, [adminAuth.loading]);

  // Return combined admin functionality with proper auth context
  return {
    // Auth state from admin context
    user: adminAuth.user,
    profile: adminAuth.profile,
    session: adminAuth.session,
    loading: isLoading,
    
    // Admin operations
    ...admin,
    
    // Permission helpers based on admin role
    isFullAdmin: () => ['admin', 'full_admin'].includes(adminAuth.profile?.role),
    isReadOnlyAdmin: () => adminAuth.profile?.role === 'read_only_admin',
    canModify: () => adminAuth.profile?.role !== 'read_only_admin',
    canManageUsers: () => ['admin', 'full_admin'].includes(adminAuth.profile?.role),
    
    // Admin auth operations
    signIn: adminAuth.signIn,
    signOut: adminAuth.signOut,
    refreshProfile: adminAuth.refreshProfile,
  };
}