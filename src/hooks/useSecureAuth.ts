import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityMonitoring } from './useSecurityMonitoring';

/**
 * Enhanced authentication hook with comprehensive security monitoring
 * and rate limiting for authentication attempts
 */
export function useSecureAuth() {
  const [authAttempts, setAuthAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockUntil, setBlockUntil] = useState<Date | null>(null);
  const { logSecurityEvent, createSecurityAlert } = useSecurityMonitoring();

  const MAX_AUTH_ATTEMPTS = 5;
  const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    // Check if user is currently blocked
    const checkBlockStatus = () => {
      if (blockUntil && new Date() < blockUntil) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
        setBlockUntil(null);
        setAuthAttempts(0);
      }
    };

    const interval = setInterval(checkBlockStatus, 1000);
    checkBlockStatus(); // Check immediately

    return () => clearInterval(interval);
  }, [blockUntil]);

  const secureSignIn = async (email: string, password: string) => {
    if (isBlocked) {
      await createSecurityAlert(
        'blocked_auth_attempt',
        'medium',
        'Authentication attempt while rate-limited',
        { email, blocked_until: blockUntil }
      );
      throw new Error('Too many failed attempts. Please try again later.');
    }

    try {
      // Log authentication attempt
      await logSecurityEvent('auth_attempt', {
        email,
        timestamp: new Date().toISOString(),
        ip_address: await getClientIP()
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle failed authentication
        const newAttempts = authAttempts + 1;
        setAuthAttempts(newAttempts);

        if (newAttempts >= MAX_AUTH_ATTEMPTS) {
          const blockUntilTime = new Date(Date.now() + BLOCK_DURATION_MS);
          setBlockUntil(blockUntilTime);
          setIsBlocked(true);

          await createSecurityAlert(
            'auth_rate_limit_exceeded',
            'high',
            'Multiple failed authentication attempts detected',
            { 
              email, 
              attempts: newAttempts,
              blocked_until: blockUntilTime
            }
          );
        } else {
          await logSecurityEvent('auth_failed', {
            email,
            error: error.message,
            attempt_count: newAttempts
          });
        }

        throw error;
      }

      // Successful authentication - reset counters
      setAuthAttempts(0);
      setIsBlocked(false);
      setBlockUntil(null);

      await logSecurityEvent('auth_success', {
        email,
        user_id: data.user?.id
      });

      return { data, error };
    } catch (err) {
      throw err;
    }
  };

  const secureSignUp = async (email: string, password: string, userData: any) => {
    try {
      await logSecurityEvent('signup_attempt', {
        email,
        role: userData.role
      });

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        await logSecurityEvent('signup_failed', {
          email,
          error: error.message
        });
        throw error;
      }

      await logSecurityEvent('signup_success', {
        email,
        user_id: data.user?.id
      });

      return { data, error };
    } catch (err) {
      throw err;
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const getRemainingBlockTime = (): number => {
    if (!blockUntil) return 0;
    return Math.max(0, blockUntil.getTime() - Date.now());
  };

  return {
    secureSignIn,
    secureSignUp,
    isBlocked,
    authAttempts,
    maxAttempts: MAX_AUTH_ATTEMPTS,
    getRemainingBlockTime,
    blockUntil
  };
}