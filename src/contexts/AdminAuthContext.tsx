import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching admin profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .eq('role', 'admin') // Only allow admin profiles
        .maybeSingle(); // Use maybeSingle to avoid errors if no data
      
      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      // Verify the user is actually an admin
      if (!data || data.role !== 'admin') {
        console.warn('User is not an admin, signing out');
        throw new Error('Unauthorized: Admin access required');
      }
      
      console.log('Admin profile loaded:', data);
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
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('Auth state change:', event, session?.user?.id);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              // Defer profile fetch to prevent blocking
              setTimeout(() => {
                if (mounted) {
                  fetchProfile(session.user.id);
                }
              }, 0);
            } else {
              if (mounted) {
                setProfile(null);
              }
            }
            
            if (mounted) {
              setLoading(false);
            }
          }
        );

        // THEN check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        
        setLoading(false);

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
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
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting admin sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      // Check if user is admin after successful login
      if (data.user) {
        console.log('User signed in, checking admin status');
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

        if (!profileData || profileData.role !== 'admin') {
          console.warn('User is not an admin');
          await supabase.auth.signOut();
          throw new Error('Unauthorized: Admin access required');
        }
        
        console.log('Admin access confirmed');
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in process failed:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Admin signing out');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        // Don't throw, continue with local cleanup
      }
      
      console.log('Admin signed out successfully');
      
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Always clear local state - this will trigger AdminProtectedRoute to redirect
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
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