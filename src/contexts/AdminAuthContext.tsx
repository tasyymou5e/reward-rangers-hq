import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { connectionChecker, ConnectionStatus } from '@/utils/connectionUtils';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  networkStatus: 'connected' | 'disconnected' | 'checking';
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  testConnection: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const testConnection = async (): Promise<boolean> => {
    try {
      setNetworkStatus('checking');
      const status: ConnectionStatus = await connectionChecker.checkConnection();
      setNetworkStatus(status.isConnected ? 'connected' : 'disconnected');
      
      if (!status.isConnected && status.error) {
        setError(status.error);
      }
      
      return status.isConnected;
    } catch (err: any) {
      setNetworkStatus('disconnected');
      setError(`Connection test failed: ${err.message}`);
      return false;
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      setError(null);
      
      // Use RPC function instead of direct table access for better reliability
      const { data, error } = await supabase.rpc('get_profile_by_id_secure', {
        target_user_id: userId,
        requesting_user_id: userId
      });
      
      if (error) {
        console.error('Profile fetch error:', error);
        throw new Error(`Profile fetch failed: ${error.message}`);
      }
      
      // Verify the user is actually an admin
      const profileData = Array.isArray(data) ? data[0] : data;
      if (!profileData || !['admin', 'full_admin', 'read_only_admin', 'report_admin'].includes(profileData.role)) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      setProfile(profileData);
      setNetworkStatus('connected');
    } catch (error: any) {
      console.error('Error fetching admin profile:', error);
      setError(error.message || 'Failed to load admin profile');
      setProfile(null);
      
      // Check if it's a network error
      if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        setNetworkStatus('disconnected');
      }
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
        setError(null);
        
        // Test connection first with timeout
        const connectionTimeout = setTimeout(() => {
          if (mounted) {
            setError('Connection timeout. Please check your internet connection.');
            setLoading(false);
          }
        }, 15000);

        const isConnected = await testConnection();
        clearTimeout(connectionTimeout);
        
        if (!isConnected && mounted) {
          setError('Unable to connect to server. Please check your internet connection.');
          setLoading(false);
          return;
        }
        
        // Set up auth state listener
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted || isSigningOut) return;
            
            if (event === 'SIGNED_OUT' || !session) {
              if (mounted && !isSigningOut) {
                setSession(null);
                setUser(null);
                setProfile(null);
                setError(null);
                setLoading(false);
              }
              return;
            }
            
            if (session?.user && mounted && !isSigningOut) {
              setSession(session);
              setUser(session.user);
              await fetchProfile(session.user.id);
              setLoading(false);
            }
          }
        );
        
        subscription = data.subscription;

        // Check for existing session
        const { data: sessionData, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError('Session validation failed. Please try logging in again.');
          setLoading(false);
          return;
        }
        
        if (!mounted) return;
        
        const session = sessionData.session;
        if (session?.user && !isSigningOut) {
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);

      } catch (error: any) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError(error.message || 'Authentication system initialization failed');
          setLoading(false);
          setUser(null);
          setSession(null);
          setProfile(null);
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
  }, [isSigningOut]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      
      // Test connection first with retry
      const isConnected = await connectionChecker.retryOperation(
        () => testConnection(),
        2,
        1000
      );
      
      if (!isConnected) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }

      // Perform sign in with retry mechanism
      const result = await connectionChecker.retryOperation(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Provide user-friendly error messages
          let friendlyMessage = error.message;
          if (error.message.includes('Invalid login credentials')) {
            friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (error.message.includes('Email not confirmed')) {
            friendlyMessage = 'Please check your email and click the confirmation link to complete your account setup.';
          } else if (error.message.includes('Too many requests')) {
            friendlyMessage = 'Too many login attempts. Please wait a moment and try again.';
          } else if (error.message.includes('Network')) {
            friendlyMessage = 'Network error. Please check your internet connection and try again.';
          }
          
          throw new Error(friendlyMessage);
        }

        return { data, error: null };
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('Sign in process failed:', error);
      setError(error.message || 'Authentication failed');
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
          
          // Navigate to admin auth
          window.location.replace('/admin/auth');
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
    loading,
    error,
    networkStatus,
    signIn,
    signOut,
    refreshProfile,
    testConnection,
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