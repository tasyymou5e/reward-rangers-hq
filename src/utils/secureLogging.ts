/**
 * Secure logging utilities that remove sensitive data and disable console logs in production
 */

// Check if we're in production environment
const isProduction = import.meta.env.PROD;

// Security: List of sensitive data patterns to filter out
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /session/i,
  /email/i,
  /phone/i,
  /ssn/i,
  /credit/i,
  /card/i,
  /api_key/i,
  /bearer/i,
  /authorization/i
];

// Filter sensitive data from objects
const filterSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(filterSensitiveData);
  }
  
  const filtered: any = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    if (isSensitive) {
      filtered[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
};

/**
 * Secure console logger that filters sensitive data and disables in production
 */
export const secureLog = {
  error: (message: string, data?: any) => {
    if (isProduction) return; // No logging in production
    
    // Filter sensitive data before logging
    const filteredData = data ? filterSensitiveData(data) : undefined;
    console.error(`[SECURE LOG] ${message}`, filteredData);
  },
  
  warn: (message: string, data?: any) => {
    if (isProduction) return; // No logging in production
    
    const filteredData = data ? filterSensitiveData(data) : undefined;
    console.warn(`[SECURE LOG] ${message}`, filteredData);
  },
  
  info: (message: string, data?: any) => {
    if (isProduction) return; // No logging in production
    
    const filteredData = data ? filterSensitiveData(data) : undefined;
    console.info(`[SECURE LOG] ${message}`, filteredData);
  },
  
  debug: (message: string, data?: any) => {
    if (isProduction) return; // No logging in production
    
    const filteredData = data ? filterSensitiveData(data) : undefined;
    console.debug(`[SECURE LOG] ${message}`, filteredData);
  }
};

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
          ...filterSensitiveData(metadata),
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