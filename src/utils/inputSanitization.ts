/**
 * Input sanitization utilities for enhanced security
 * Prevents XSS, SQL injection, and other input-based attacks
 */

// HTML sanitization patterns
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

// SQL injection patterns to detect and block
const SQL_INJECTION_PATTERNS = [
  /('|(\\\')|(\-\-)|(\;)|(\|)|(\*)|(%)|(\+)|(\\)|(\\\\)|(\/\/)|(\|\|)|(&&)|(<<)|(>>)|(xp_)|(sp_)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(exec)|(execute)|(declare)|(union)|(script)|(table)|(database)|(schema))/gi,
  /(SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+.*SET|DELETE\s+FROM|DROP\s+TABLE|CREATE\s+TABLE|ALTER\s+TABLE|UNION\s+SELECT)/gi,
  /(\/\*.*\*\/|--.*$|#.*$)/gm
];

// XSS patterns to detect and block
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /<\s*\w+[^>]*on\w+\s*=.*?>/gi
];

/**
 * Sanitize HTML content by escaping special characters
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input.replace(/[&<>"'`=\/]/g, (match) => HTML_ENTITIES[match] || match);
};

/**
 * Detect potential SQL injection attempts
 */
export const detectSqlInjection = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Detect potential XSS attempts
 */
export const detectXss = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  
  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Comprehensive input sanitization for user data
 */
export const sanitizeUserInput = (input: string, options: {
  allowHtml?: boolean;
  maxLength?: number;
  strict?: boolean;
} = {}): string => {
  const { allowHtml = false, maxLength = 1000, strict = true } = options;
  
  if (typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Check length limits
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Detect malicious patterns in strict mode
  if (strict) {
    if (detectSqlInjection(sanitized)) {
      throw new Error('Invalid input: potential SQL injection detected');
    }
    
    if (detectXss(sanitized)) {
      throw new Error('Invalid input: potential XSS detected');
    }
  }
  
  // Sanitize HTML if not allowed
  if (!allowHtml) {
    sanitized = sanitizeHtml(sanitized);
  }
  
  return sanitized;
};

/**
 * Sanitize object with multiple string fields
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T, 
  options?: Parameters<typeof sanitizeUserInput>[1]
): T => {
  const sanitized = { ...obj } as T;
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      (sanitized as any)[key] = sanitizeUserInput(value, options);
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as any)[key] = sanitizeObject(value, options);
    }
  }
  
  return sanitized;
};

/**
 * Validate email format with enhanced security
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // Basic length check
  if (email.length > 254) return false;
  
  // Enhanced email regex that prevents common attacks
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email);
};

/**
 * Validate and sanitize URL
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow safe protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Prevent javascript: and data: URLs
    if (urlObj.protocol === 'javascript:' || urlObj.protocol === 'data:') {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
};

/**
 * Rate limiting helper for input validation
 */
const validationAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const checkValidationRateLimit = (identifier: string, maxAttempts = 10, windowMs = 60000): boolean => {
  const now = Date.now();
  const attempts = validationAttempts.get(identifier);
  
  if (!attempts || now - attempts.lastAttempt > windowMs) {
    validationAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (attempts.count >= maxAttempts) {
    return false;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
};