/**
 * CSRF Protection utilities for enhanced security
 */

// Store CSRF tokens
const csrfTokens = new Map<string, { token: string; expires: number }>();

/**
 * Generate a secure CSRF token
 */
export const generateCSRFToken = (sessionId: string): string => {
  const token = crypto.randomUUID();
  const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  csrfTokens.set(sessionId, { token, expires });
  
  // Clean up expired tokens
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < Date.now()) {
      csrfTokens.delete(key);
    }
  }
  
  return token;
};

/**
 * Validate CSRF token
 */
export const validateCSRFToken = (sessionId: string, token: string): boolean => {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored || stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
};

/**
 * Remove CSRF token (for logout)
 */
export const removeCSRFToken = (sessionId: string): void => {
  csrfTokens.delete(sessionId);
};

/**
 * Add CSRF token to form data
 */
export const addCSRFToken = (formData: FormData, sessionId: string): void => {
  const token = generateCSRFToken(sessionId);
  formData.append('csrf_token', token);
};

/**
 * Verify request has valid CSRF token
 */
export const verifyCSRFToken = (request: Request, sessionId: string): boolean => {
  const token = request.headers.get('X-CSRF-Token') || 
                new URL(request.url).searchParams.get('csrf_token');
  
  if (!token) return false;
  
  return validateCSRFToken(sessionId, token);
};