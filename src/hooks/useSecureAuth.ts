import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityMonitoring } from './useSecurityMonitoring';
import { secureLog } from '@/utils/secureLogging';

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
          secureLog.info('Authentication block expired, attempts reset');
        }
      }
    };

    checkBlockStatus();
    const interval = setInterval(checkBlockStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [blockUntil]);

  /**
   * Secure sign-in with rate limiting and comprehensive logging
   */
  const secureSignIn = useCallback(async (email: string, password: string) => {
    try {
      // Check rate limiting before attempt
      if (authAttempts >= MAX_AUTH_ATTEMPTS) {
        const newBlockUntil = Date.now() + BLOCK_DURATION_MS;
        setBlockUntil(newBlockUntil);
        setIsBlocked(true);
        
        await createSecurityAlert(
          'rate_limit_exceeded',
          'high',
          `User exceeded maximum authentication attempts (${MAX_AUTH_ATTEMPTS})`,
          { 
            email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            attempts: authAttempts,
            blockedUntil: new Date(newBlockUntil).toISOString()
          }
        );
        
        return { 
          data: null, 
          error: { message: 'Too many attempts. Account temporarily blocked.' } 
        };
      }

      // Get client IP for enhanced logging
      const clientIP = await getClientIP();
      
      // Log authentication attempt
      await logSecurityEvent('auth_signin_attempt', {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        attempt_number: authAttempts + 1,
        client_ip: clientIP,
        timestamp: new Date().toISOString()
      });

      // Perform authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Increment attempt counter on failure
        const newAttempts = authAttempts + 1;
        setAuthAttempts(newAttempts);
        
        // Log failed attempt
        await logSecurityEvent('auth_signin_failed', {
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          error_type: error.message,
          attempt_number: newAttempts,
          client_ip: clientIP,
          timestamp: new Date().toISOString()
        });
        
        secureLog.warn('Authentication failed', { 
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          attempts: newAttempts
        });
        
        return { data: null, error };
      }

      // Reset attempts on successful login
      setAuthAttempts(0);
      setBlockUntil(null);
      
      // Log successful authentication
      await logSecurityEvent('auth_signin_success', {
        user_id: data.user?.id,
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        client_ip: clientIP,
        timestamp: new Date().toISOString()
      });
      
      secureLog.info('Authentication successful', { 
        user_id: data.user?.id 
      });
      
      return { data, error: null };
      
    } catch (error) {
      secureLog.error('Authentication error', { error });
      await logSecurityEvent('auth_signin_error', {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return { 
        data: null, 
        error: { message: 'Authentication service unavailable' } 
      };
    }
  }, [authAttempts, logSecurityEvent, createSecurityAlert]);

  /**
   * Secure sign-up with enhanced validation and logging
   */
  const secureSignUp = useCallback(async (email: string, password: string, userData: any) => {
    try {
      const clientIP = await getClientIP();
      
      // Log signup attempt
      await logSecurityEvent('auth_signup_attempt', {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        role: userData.role,
        client_ip: clientIP,
        timestamp: new Date().toISOString()
      });

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData,
        }
      });

      if (error) {
        await logSecurityEvent('auth_signup_failed', {
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          error_type: error.message,
          client_ip: clientIP
        });
        return { data: null, error };
      }

      // Log successful signup
      await logSecurityEvent('auth_signup_success', {
        user_id: data.user?.id,
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        role: userData.role,
        client_ip: clientIP
      });
      
      return { data, error: null };
      
    } catch (error) {
      await logSecurityEvent('auth_signup_error', {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return { 
        data: null, 
        error: { message: 'Registration service unavailable' } 
      };
    }
  }, [logSecurityEvent]);

  /**
   * Get client IP address for security logging
   */
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  /**
   * Get remaining block time in milliseconds
   */
  const getRemainingBlockTime = useCallback((): number => {
    if (!blockUntil) return 0;
    return Math.max(0, blockUntil - Date.now());
  }, [blockUntil]);

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