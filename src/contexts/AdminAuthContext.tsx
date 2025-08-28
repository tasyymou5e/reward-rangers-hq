import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      // Fetching admin profile securely
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .in('role', ['admin', 'full_admin', 'read_only_admin', 'report_admin']) // Allow all admin roles
        .maybeSingle(); // Use maybeSingle to avoid errors if no data
      
      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      // Verify the user is actually an admin
      if (!data || !['admin', 'full_admin', 'read_only_admin', 'report_admin'].includes(data.role)) {
        console.warn('User is not an admin, signing out');
        throw new Error('Unauthorized: Admin access required');
      }
      
      // Admin profile loaded successfully
      setProfile(data);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      // If not admin, sign out
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error during sign out:', signOutError);
      }
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;
    
    const initializeAuth = async () => {
      try {
        // Set up auth state listener FIRST
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted || isSigningOut) return;
            
            // Auth state change detected
            
            // Only update state if we're not in the middle of signing out
            if (event === 'SIGNED_OUT' || !session) {
              // User signed out or session ended
              if (mounted && !isSigningOut) {
                setSession(null);
                setUser(null);
                setProfile(null);
                setLoading(false);
              }
              return;
            }
            
            if (session?.user && mounted && !isSigningOut) {
              setSession(session);
              setUser(session.user);
              
              // Defer profile fetch to prevent blocking
              setTimeout(async () => {
                if (mounted && !isSigningOut) {
                  await fetchProfile(session.user.id);
                }
              }, 100);
            } else {
              // Only set loading to false if there's no user
              if (mounted) {
                setLoading(false);
              }
            }
          }
        );
        
        subscription = data.subscription;

        // THEN check for existing session
        const { data: sessionData, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (!mounted) return;
        
        const session = sessionData.session;
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && !isSigningOut) {
          await fetchProfile(session.user.id);
        }
        
        setLoading(false);

      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isSigningOut]); // Add isSigningOut as dependency

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      // Attempting admin sign in
      const authRequest: any = {
        email,
        password,
      };
      
      if (captchaToken) {
        authRequest.options = {
          captchaToken,
        };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword(authRequest);

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      // Check if user is admin after successful login
      if (data.user) {
        // User signed in, checking admin status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile check error:', profileError);
          await supabase.auth.signOut();
          throw new Error('Profile verification failed');
        }

        if (!profileData || !['admin', 'full_admin', 'read_only_admin', 'report_admin'].includes(profileData.role)) {
          console.warn('User is not an admin');
          await supabase.auth.signOut();
          throw new Error('Unauthorized: Admin access required');
        }
        
        // Admin access confirmed
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in process failed:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    if (isSigningOut) {
      // Sign out already in progress, skipping
      return;
    }
    
    try {
      // Admin signOut function called - starting process
      setIsSigningOut(true);
      
      // Clear local state first to prevent loops
      // Clearing local auth state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
      
      // Try to sign out from Supabase, but don't fail if session is missing
      // Attempting supabase auth signOut
      try {
        const { error } = await supabase.auth.signOut();
        if (error && error.message !== 'Auth session missing!') {
          console.error('Supabase sign out error:', error);
        } else {
          // Supabase sign out completed (or session was already gone)
        }
      } catch (authError: any) {
        // AuthSessionMissingError is actually fine when signing out
        if (authError.message?.includes('Auth session missing')) {
          // Session was already missing - this is fine for sign out
        } else {
          console.error('Unexpected auth error:', authError);
        }
      }
      
      // Sign out process completed successfully
      
      // Safe navigation that avoids security errors
      // Safely navigating to admin auth
      try {
        // Use a more secure approach to navigation
        if (typeof window !== 'undefined' && window.location) {
          // Clear any stored auth data first
          try {
            localStorage.removeItem('sb-rdvkwnoeojjvjuknlsjd-auth-token');
          } catch (storageError) {
            // Could not clear localStorage, proceeding anyway
          }
          
          // Navigate using hash router
          window.location.replace('#/admin/auth');
        }
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback: force page reload to clear state
        try {
          window.location.reload();
        } catch (reloadError) {
          console.error('Could not reload page:', reloadError);
        }
      }
      
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading: loading || profileLoading, // Keep loading true while either auth or profile is loading
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}