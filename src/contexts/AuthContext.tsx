import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<any>;
  signUp: (email: string, password: string, userData: any, captchaToken?: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Direct security logging function to avoid circular dependency
  const logSecurityEvent = async (eventType: string, metadata: any = {}) => {
    try {
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: eventType,
        user_id_param: user?.id || null,
        metadata_param: metadata
      });
    } catch (error) {
      // Silently handle security logging errors to avoid breaking auth flow
      console.error('Security logging error:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      // Use secure profile function instead of direct table access
      const { data, error } = await supabase.rpc('get_profile_by_id_secure', {
        target_user_id: userId,
        requesting_user_id: userId
      });
      
      if (error) throw error;
      
      // The secure function returns an array, get the first item
      const profileData = data?.[0];
      setProfile(profileData);
      
      // Log successful profile access for security monitoring
      await logSecurityEvent('profile_accessed_secure', {
        user_id: userId,
        access_method: 'auth_context'
      });
    } catch (error) {
      // Log failed profile access attempt
      await logSecurityEvent('profile_access_failed', {
        user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        access_method: 'auth_context'
      });
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to prevent blocking
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken
      }
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, userData: any, captchaToken?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData,
        captchaToken
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}