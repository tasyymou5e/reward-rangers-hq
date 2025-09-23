import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Enhanced authentication state with comprehensive security features
interface AuthState {
  // Core State
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isAdmin: boolean;
  loading: boolean;
  isCheckingRole: boolean;
  sessionReady: boolean;
  signingOut: boolean;
  
  // Error and Security State
  error: string | null;
  lastActivity: Date | null;
  deviceInfo: Record<string, any>;
  
  // Actions
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any; isAdmin?: boolean }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string, userType?: 'admin' | 'user') => Promise<{ error: any }>;
  fetchUserRole: (userId: string) => Promise<string | null>;
  checkAdminRole: (userId: string) => Promise<boolean>;
  setError: (error: string | null) => void;
  clearError: () => void;
  emergencyLogout: () => void;
  updateLastActivity: () => void;
}

// Device info collection for security monitoring
const getBrowserInfo = () => ({
  userAgent: navigator.userAgent,
  language: navigator.language,
  platform: navigator.platform,
  timestamp: new Date().toISOString(),
});

// Enhanced security event logging
const logSecurityEvent = async (eventType: string, userId: string | null, metadata: any = {}) => {
  try {
    await supabase.rpc('log_security_event_with_rate_limit', {
      event_type: eventType,
      user_id_param: userId,
      metadata_param: {
        ...metadata,
        timestamp: new Date().toISOString(),
        deviceInfo: getBrowserInfo(),
      }
    });
  } catch (error) {
    console.error('Security logging error:', error);
  }
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        userRole: null,
        isAdmin: false,
        loading: true,
        isCheckingRole: false,
        sessionReady: false,
        signingOut: false,
        error: null,
        lastActivity: null,
        deviceInfo: getBrowserInfo(),

        // Initialize authentication state
        initialize: () => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              set({ session, user: session?.user ?? null });
              
              if (session?.user) {
                const userRole = await get().fetchUserRole(session.user.id);
                const isAdmin = userRole === 'admin';
                
                // Atomic state update to prevent race conditions
                set({
                  userRole,
                  isAdmin,
                  loading: false,
                  isCheckingRole: false,
                  sessionReady: true,
                  lastActivity: new Date(),
                  error: null
                });

                await logSecurityEvent('session_established', session.user.id, {
                  event,
                  role: userRole
                });
              } else {
                set({
                  userRole: null,
                  isAdmin: false,
                  loading: false,
                  isCheckingRole: false,
                  sessionReady: true,
                  lastActivity: null
                });
              }
            }
          );

          // Check for existing session
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              set({ session, user: session.user });
              get().fetchUserRole(session.user.id);
            } else {
              set({ loading: false, sessionReady: true });
            }
          });

          return () => subscription.unsubscribe();
        },

        // Enhanced sign in with comprehensive security logging
        signIn: async (email: string, password: string) => {
          try {
            set({ loading: true, error: null });
            
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              await logSecurityEvent('failed_login_attempt', null, {
                email: email.split('@')[0] + '@***',
                error: error.message,
                attempt_timestamp: new Date().toISOString()
              });
              
              set({ error: error.message, loading: false });
              return { data: null, error };
            }

            if (data.user) {
              // Fetch role synchronously to prevent race conditions
              const userRole = await get().fetchUserRole(data.user.id);
              const isAdmin = userRole === 'admin';

              // Set ALL auth state atomically
              set({
                user: data.user,
                session: data.session,
                userRole,
                isAdmin,
                loading: false,
                isCheckingRole: false,
                sessionReady: true,
                lastActivity: new Date(),
                error: null
              });

              await logSecurityEvent('successful_login', data.user.id, {
                email: email.split('@')[0] + '@***',
                role: userRole,
                login_timestamp: new Date().toISOString()
              });

              return { data, error: null, isAdmin };
            }

            return { data, error };
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
            set({ error: errorMessage, loading: false });
            return { data: null, error: { message: errorMessage } };
          }
        },

        // Enhanced sign up with security logging
        signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
          try {
            set({ loading: true, error: null });
            
            const redirectUrl = `${window.location.origin}/`;
            
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: redirectUrl,
                data: {
                  first_name: firstName,
                  last_name: lastName,
                },
              },
            });

            if (error) {
              await logSecurityEvent('failed_signup_attempt', null, {
                email: email.split('@')[0] + '@***',
                error: error.message
              });
              
              set({ error: error.message, loading: false });
              return { error };
            }

            if (data.user) {
              await logSecurityEvent('successful_signup', data.user.id, {
                email: email.split('@')[0] + '@***',
                has_name: !!(firstName || lastName)
              });
            }

            set({ loading: false, error: null });
            return { error: null };
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
            set({ error: errorMessage, loading: false });
            return { error: { message: errorMessage } };
          }
        },

        // Enhanced sign out with security logging
        signOut: async () => {
          try {
            set({ signingOut: true, error: null });
            
            const currentUser = get().user;
            if (currentUser) {
              await logSecurityEvent('user_logout', currentUser.id, {
                logout_timestamp: new Date().toISOString()
              });
            }

            const { error } = await supabase.auth.signOut();
            
            // Clear all auth state
            set({
              user: null,
              session: null,
              userRole: null,
              isAdmin: false,
              loading: false,
              isCheckingRole: false,
              sessionReady: true,
              signingOut: false,
              lastActivity: null,
              error: null
            });

            return { error };
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
            set({ error: errorMessage, signingOut: false });
            return { error: { message: errorMessage } };
          }
        },

        // Password reset with user type support
        resetPassword: async (email: string, userType: 'admin' | 'user' = 'user') => {
          try {
            const redirectUrl = userType === 'admin' 
              ? `${window.location.origin}/admin/reset-password-confirm`
              : `${window.location.origin}/auth?tab=reset-confirm`;
              
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: redirectUrl,
            });

            if (!error) {
              await logSecurityEvent('password_reset_requested', null, {
                email: email.split('@')[0] + '@***',
                user_type: userType
              });
            }

            return { error };
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
            return { error: { message: errorMessage } };
          }
        },

        // Role checking with caching and security
        fetchUserRole: async (userId: string) => {
          try {
            set({ isCheckingRole: true });
            
            const { data, error } = await supabase.rpc('get_profile_by_id_secure', {
              target_user_id: userId,
              requesting_user_id: userId
            });

            if (error) throw error;

            const role = data?.[0]?.role || 'kid';
            set({ userRole: role, isCheckingRole: false });
            return role;
          } catch (error) {
            console.error('Error fetching user role:', error);
            set({ userRole: 'kid', isCheckingRole: false });
            return 'kid';
          }
        },

        // Admin role verification
        checkAdminRole: async (userId: string) => {
          const role = await get().fetchUserRole(userId);
          return role === 'admin';
        },

        // Error management
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),

        // Emergency logout for security incidents
        emergencyLogout: async () => {
          const currentUser = get().user;
          if (currentUser) {
            await logSecurityEvent('emergency_logout', currentUser.id, {
              reason: 'security_incident',
              timestamp: new Date().toISOString()
            });
          }
          
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            userRole: null,
            isAdmin: false,
            loading: false,
            sessionReady: true,
            error: 'Security logout - please sign in again'
          });
        },

        // Activity tracking
        updateLastActivity: () => set({ lastActivity: new Date() }),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          lastActivity: state.lastActivity,
          deviceInfo: state.deviceInfo,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);