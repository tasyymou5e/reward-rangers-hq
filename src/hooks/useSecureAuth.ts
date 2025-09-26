import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityMonitoring } from './useSecurityMonitoring';

/**
 * Enhanced authentication hook with security monitoring, rate limiting, and IP tracking
 * Implements security framework guidelines for authentication
 */

const MAX_AUTH_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface AuthAttemptData {
  attempts: number;
  blockUntil: number | null;
  lastAttempt: number;
}

export function useSecureAuth() {
  const [authAttempts, setAuthAttempts] = useState(0);
  const [blockUntil, setBlockUntil] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const { logSecurityEvent, createSecurityAlert } = useSecurityMonitoring();

  // Check and update block status
  useEffect(() => {
    const checkBlockStatus = () => {
      if (blockUntil && Date.now() < blockUntil) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
        if (blockUntil && Date.now() >= blockUntil) {
          // Reset attempts when block expires
          setAuthAttempts(0);
          setBlockUntil(null);
          localStorage.removeItem('auth_attempts');
        }
      }
    };

    // Load stored attempt data
    const storedData = localStorage.getItem('auth_attempts');
    if (storedData) {
      try {
        const data: AuthAttemptData = JSON.parse(storedData);
        setAuthAttempts(data.attempts);
        setBlockUntil(data.blockUntil);
      } catch (error) {
        // Clear corrupted data
        localStorage.removeItem('auth_attempts');
      }
    }

    checkBlockStatus();
    
    // Check block status every minute
    const interval = setInterval(checkBlockStatus, 60000);
    return () => clearInterval(interval);
  }, [blockUntil]);

  // Store attempt data to localStorage
  const updateAttemptData = useCallback((attempts: number, blockUntil: number | null) => {
    const data: AuthAttemptData = {
      attempts,
      blockUntil,
      lastAttempt: Date.now()
    };
    localStorage.setItem('auth_attempts', JSON.stringify(data));
    setAuthAttempts(attempts);
    setBlockUntil(blockUntil);
  }, []);

  // Record failed authentication attempt
  const recordFailedAttempt = useCallback(async (email: string, error: string) => {
    const newAttempts = authAttempts + 1;
    let newBlockUntil = blockUntil;

    if (newAttempts >= MAX_AUTH_ATTEMPTS) {
      newBlockUntil = Date.now() + BLOCK_DURATION_MS;
      setIsBlocked(true);
      
      // Create high-severity security alert
      await createSecurityAlert(
        'multiple_failed_auth_attempts',
        'high',
        `${MAX_AUTH_ATTEMPTS} failed authentication attempts detected`,
        {
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          attempts: newAttempts,
          blocked_until: new Date(newBlockUntil).toISOString(),
          error_type: error
        }
      );
    }

    updateAttemptData(newAttempts, newBlockUntil);

    // Log security event
    await logSecurityEvent('auth_failed_attempt', {
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      attempt_number: newAttempts,
      error_type: error,
      is_blocked: newAttempts >= MAX_AUTH_ATTEMPTS,
      block_expires: newBlockUntil ? new Date(newBlockUntil).toISOString() : null
    });
  }, [authAttempts, blockUntil, updateAttemptData, logSecurityEvent, createSecurityAlert]);

  // Record successful authentication
  const recordSuccessfulAttempt = useCallback(async (email: string, userId: string) => {
    // Reset attempts on successful login
    updateAttemptData(0, null);
    setIsBlocked(false);

    await logSecurityEvent('auth_success', {
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      user_id: userId,
      previous_attempts: authAttempts
    });
  }, [authAttempts, updateAttemptData, logSecurityEvent]);

  // Secure sign in with monitoring
  const secureSignIn = useCallback(async (email: string, password: string) => {
    if (isBlocked) {
      const timeRemaining = blockUntil ? Math.ceil((blockUntil - Date.now()) / 60000) : 0;
      return {
        data: null,
        error: new Error(`Account temporarily blocked. Try again in ${timeRemaining} minutes.`)
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        await recordFailedAttempt(email, error.message);
        return { data: null, error };
      }

      if (data.user) {
        await recordSuccessfulAttempt(email, data.user.id);
      }

      return { data, error: null };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      await recordFailedAttempt(email, errorMessage);
      return { data: null, error: new Error(errorMessage) };
    }
  }, [isBlocked, blockUntil, recordFailedAttempt, recordSuccessfulAttempt]);

  // Secure sign up with monitoring
  const secureSignUp = useCallback(async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });

      if (error) {
        await logSecurityEvent('auth_signup_failed', {
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          error_type: error.message
        });
        return { data: null, error };
      }

      if (data.user) {
        await logSecurityEvent('auth_signup_success', {
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          user_id: data.user.id,
          needs_confirmation: !data.user.email_confirmed_at
        });
      }

      return { data, error: null };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      await logSecurityEvent('auth_signup_error', {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        error: errorMessage
      });

      return { data: null, error: new Error(errorMessage) };
    }
  }, [logSecurityEvent]);

  return {
    secureSignIn,
    secureSignUp,
    isBlocked,
    authAttempts,
    maxAttempts: MAX_AUTH_ATTEMPTS,
    blockUntil,
    recordFailedAttempt,
    recordSuccessfulAttempt
  };
}