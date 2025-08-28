import React, { useRef, useCallback } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface CaptchaWidgetProps {
  /**
   * Callback fired when captcha is successfully verified
   * @param token - The captcha verification token
   */
  onVerify: (token: string) => void;
  
  /**
   * Callback fired when captcha verification fails
   * @param error - The error that occurred
   */
  onError?: (error: string) => void;
  
  /**
   * Callback fired when captcha expires
   */
  onExpire?: () => void;
  
  /**
   * Whether to show the captcha widget
   */
  visible?: boolean;
  
  /**
   * Custom CSS class for styling
   */
  className?: string;
}

/**
 * Secure captcha widget component using hCaptcha
 * Integrates with Supabase authentication for bot protection
 */
export function CaptchaWidget({ 
  onVerify, 
  onError, 
  onExpire, 
  visible = true,
  className 
}: CaptchaWidgetProps) {
  const captchaRef = useRef<HCaptcha>(null);
  
  // Use Supabase site key for hCaptcha integration
  // This should match the configuration in Supabase dashboard
  const siteKey = "10000000-ffff-ffff-ffff-000000000001"; // Test key - replace with actual production key
  
  const handleVerify = useCallback((token: string) => {
    onVerify(token);
  }, [onVerify]);
  
  const handleError = useCallback((error: string) => {
    console.error('Captcha verification error:', error);
    onError?.(error);
  }, [onError]);
  
  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);
  
  /**
   * Reset the captcha widget
   */
  const resetCaptcha = useCallback(() => {
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
  }, []);
  
  /**
   * Execute the captcha challenge programmatically
   */
  const executeCaptcha = useCallback(async () => {
    if (captchaRef.current) {
      return captchaRef.current.execute();
    }
  }, []);
  
  if (!visible) {
    return null;
  }
  
  return (
    <div className={className}>
      <HCaptcha
        ref={captchaRef}
        sitekey={siteKey}
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        theme="light"
        size="normal"
      />
    </div>
  );
}

export default CaptchaWidget;