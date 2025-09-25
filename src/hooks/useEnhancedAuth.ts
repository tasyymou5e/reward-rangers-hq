import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrimaryEmailAuth } from './usePrimaryEmailAuth';
import { useSecureAuth } from './useSecureAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface AuthResult {
  success: boolean;
  data?: any;
  error?: string;
  requiresEmailResolution?: boolean;
  resolvedEmail?: string;
}

/**
 * Enhanced authentication hook that integrates:
 * - Traditional email/password auth
 * - Primary Email Designator System
 * - Security monitoring and rate limiting
 * - Email resolution and routing
 */
export const useEnhancedAuth = () => {
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { secureSignIn, secureSignUp, isBlocked, authAttempts, maxAttempts } = useSecureAuth();
  const { resolveToPrimaryEmail, getFamilyByEmail } = usePrimaryEmailAuth();
  const { toast } = useToast();

  /**
   * Enhanced sign in with email resolution and routing
   */
  const enhancedSignIn = useCallback(async (
    email: string, 
    password: string,
    useEmailResolution = true
  ): Promise<AuthResult> => {
    if (isBlocked) {
      return {
        success: false,
        error: 'Account temporarily blocked due to too many failed attempts'
      };
    }

    setLoading(true);
    
    try {
      let resolvedEmail = email;
      let familyContext = null;

      // Step 1: Resolve email if using the new system
      if (useEmailResolution) {
        try {
          const primaryEmail = await resolveToPrimaryEmail(email);
          if (primaryEmail && primaryEmail !== email) {
            resolvedEmail = primaryEmail;
            toast({
              title: "Email Resolved",
              description: `Using primary family email for authentication`,
            });
          }

          // Get family context for enhanced logging
          familyContext = await getFamilyByEmail(email);
        } catch (error) {
          // Email resolution failed, continue with original email
          console.warn('Email resolution failed, using original email:', error);
        }
      }

      // Step 2: Attempt secure authentication
      const result = await secureSignIn(resolvedEmail, password);

      if (result.error) {
        // Log the authentication attempt with family context
        await supabase.rpc('log_security_event_with_rate_limit', {
          event_type: 'enhanced_auth_signin_failed',
          user_id_param: null,
          metadata_param: {
            original_email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            resolved_email: resolvedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            email_was_resolved: resolvedEmail !== email,
            family_context: familyContext,
            error_type: result.error.message,
            timestamp: new Date().toISOString()
          }
        });

        return {
          success: false,
          error: result.error.message,
          resolvedEmail: resolvedEmail !== email ? resolvedEmail : undefined
        };
      }

      // Log successful authentication with context
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: 'enhanced_auth_signin_success',
        user_id_param: result.data?.user?.id,
        metadata_param: {
          original_email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          resolved_email: resolvedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          email_was_resolved: resolvedEmail !== email,
          family_context: familyContext,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        data: result.data,
        resolvedEmail: resolvedEmail !== email ? resolvedEmail : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: 'enhanced_auth_error',
        user_id_param: null,
        metadata_param: {
          original_email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [isBlocked, secureSignIn, resolveToPrimaryEmail, getFamilyByEmail, toast]);

  /**
   * Enhanced sign up with family email system integration
   */
  const enhancedSignUp = useCallback(async (
    email: string,
    password: string,
    userData: any,
    createFamily = false,
    familyName?: string
  ): Promise<AuthResult> => {
    setLoading(true);

    try {
      // Check if email might conflict with existing system
      const existingFamily = await getFamilyByEmail(email);
      if (existingFamily) {
        return {
          success: false,
          error: 'This email is already associated with a family. Please use a different email or sign in.',
          requiresEmailResolution: true
        };
      }

      // Use secure signup
      const result = await secureSignUp(email, password, userData);

      if (result.error) {
        return {
          success: false,
          error: result.error.message
        };
      }

      // If creating a family, set up primary email system
      if (createFamily && familyName && result.data?.user) {
        try {
          // Create family with primary email designator
          const { error: familyError } = await supabase
            .from('families')
            .insert({
              name: familyName,
              parent_id: result.data.user.id,
              primary_email_designator: email,
              created_by_primary_email: true
            });

          if (familyError) {
            console.error('Failed to create family:', familyError);
            // Don't fail the signup, just log the issue
            await supabase.rpc('log_security_event_with_rate_limit', {
              event_type: 'family_creation_failed_after_signup',
              user_id_param: result.data.user.id,
              metadata_param: {
                email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
                family_name: familyName,
                error: familyError.message,
                timestamp: new Date().toISOString()
              }
            });
          } else {
            // Log successful family creation with primary email
            await supabase.rpc('log_security_event_with_rate_limit', {
              event_type: 'family_created_with_primary_email',
              user_id_param: result.data.user.id,
              metadata_param: {
                email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
                family_name: familyName,
                timestamp: new Date().toISOString()
              }
            });
          }
        } catch (error) {
          console.error('Family creation error:', error);
        }
      }

      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: 'enhanced_auth_signup_error',
        user_id_param: null,
        metadata_param: {
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [secureSignUp, getFamilyByEmail]);

  /**
   * Check if an email can be resolved to a primary family email
   */
  const checkEmailResolution = useCallback(async (email: string) => {
    try {
      const resolvedEmail = await resolveToPrimaryEmail(email);
      const familyContext = await getFamilyByEmail(email);
      
      return {
        canResolve: resolvedEmail !== email,
        resolvedEmail,
        hasFamily: !!familyContext,
        familyId: familyContext
      };
    } catch (error) {
      return {
        canResolve: false,
        resolvedEmail: email,
        hasFamily: false,
        familyId: null
      };
    }
  }, [resolveToPrimaryEmail, getFamilyByEmail]);

  return {
    enhancedSignIn,
    enhancedSignUp,
    checkEmailResolution,
    loading,
    isBlocked,
    authAttempts,
    maxAttempts
  };
};