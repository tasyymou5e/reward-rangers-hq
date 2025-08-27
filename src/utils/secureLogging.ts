/**
 * Secure logging utilities that remove sensitive data and disable console logs in production
 */

// Check if we're in production environment
const isProduction = import.meta.env.PROD;

/**
 * Secure console logger that filters sensitive data and disables in production
 */
export const secureLog = {
  error: (message: string, data?: any) => {
    if (isProduction) return; // No logging in production
    
    // Filter sensitive data
    const sanitizedData = sanitizeLogData(data);
    console.error(message, sanitizedData);
  },
  
  warn: (message: string, data?: any) => {
    if (isProduction) return;
    
    const sanitizedData = sanitizeLogData(data);
    console.warn(message, sanitizedData);
  },
  
  info: (message: string, data?: any) => {
    if (isProduction) return;
    
    const sanitizedData = sanitizeLogData(data);
    console.log(message, sanitizedData);
  },
  
  debug: (message: string, data?: any) => {
    if (isProduction) return;
    
    const sanitizedData = sanitizeLogData(data);
    console.debug(message, sanitizedData);
  }
};

/**
 * Sanitizes log data by removing sensitive information
 */
function sanitizeLogData(data: any): any {
  if (!data) return data;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'api_key', 'auth',
    'email', 'phone', 'ssn', 'credit_card', 'backup_codes',
    'mfa_secret', 'totp_secret', 'private_key'
  ];
  
  if (typeof data === 'object') {
    const sanitized = { ...data };
    
    // Recursively sanitize object properties
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      
      // Remove sensitive fields
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeLogData(sanitized[key]);
      }
    });
    
    return sanitized;
  }
  
  // For strings, check if they look like sensitive data
  if (typeof data === 'string') {
    // Mask email addresses
    if (data.includes('@') && data.includes('.')) {
      const [local, domain] = data.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    }
    
    // Mask long strings that might be tokens
    if (data.length > 20 && /^[a-zA-Z0-9+/=]+$/.test(data)) {
      return `${data.substring(0, 4)}...[REDACTED]`;
    }
  }
  
  return data;
}

/**
 * Security-specific logger for audit trails (always logs to server, never console)
 */
export const securityAuditLog = {
  logSecurityEvent: async (eventType: string, userId?: string, metadata?: any) => {
    try {
      // Only log to server-side security system, never to console
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: eventType,
        user_id_param: userId,
        metadata_param: {
          ...sanitizeLogData(metadata),
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent.substring(0, 100), // Limit length
          ip_context: 'client_side'
        }
      });
    } catch (error) {
      // Silently fail in production, only log in dev
      if (!isProduction) {
        console.error('Failed to log security event:', error);
      }
    }
  }
};