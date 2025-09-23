/**
 * Standardized error handling utilities following security framework guidelines
 * Implements safe error handling with appropriate logging and user-friendly messages
 */

import { secureLog } from './secureLogging';

export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorHandlingResult {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}

/**
 * Centralized error handler with security considerations
 */
export function handleError(
  error: any, 
  context: string, 
  fallbackMessage: string = 'An unexpected error occurred'
): ErrorHandlingResult {
  const errorDetails = {
    context,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  };

  // Log error securely (will be sanitized)
  secureLog.error(`Error in ${context}`, errorDetails);

  // Return user-friendly error
  return {
    success: false,
    error: getUserFriendlyError(error, fallbackMessage),
    code: getErrorCode(error)
  };
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'unknown'
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 0) {
        secureLog.info(`Operation succeeded after ${attempt} retries`, { context });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        secureLog.error(`Operation failed after ${maxRetries} retries`, { 
          context, 
          error: error instanceof Error ? error.message : String(error) 
        });
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      secureLog.warn(`Operation failed, retrying in ${delay}ms`, { 
        context, 
        attempt: attempt + 1,
        error: error instanceof Error ? error.message : String(error)
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Get user-friendly error message from error object
 * SECURITY: Never expose internal system details to users
 */
export function getUserFriendlyError(error: any, fallback: string = 'An unexpected error occurred'): string {
  if (!error) return fallback;

  // Map of internal errors to user-friendly messages
  const errorMap: Record<string, string> = {
    // Authentication errors
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please check your email and click the confirmation link',
    'Too many requests': 'Too many attempts. Please wait before trying again',
    'User not found': 'Account not found',
    'Email already registered': 'An account with this email already exists',
    
    // Authorization errors
    'insufficient_privilege': 'You do not have permission for this action',
    'access_denied': 'Access denied',
    'Forbidden': 'You do not have permission for this action',
    
    // Network errors
    'Network Error': 'Connection failed. Please check your internet connection',
    'Failed to fetch': 'Connection failed. Please try again',
    'CORS error': 'Service temporarily unavailable',
    
    // Validation errors
    'validation_error': 'Please check your input and try again',
    'invalid_input': 'Invalid input provided',
    
    // Rate limiting
    'rate_limit_exceeded': 'Too many requests. Please wait before trying again',
    
    // Database errors
    'duplicate_key': 'This information already exists',
    'foreign_key_violation': 'Cannot complete action due to related data',
    'check_violation': 'Invalid data provided',
    
    // File/upload errors
    'file_too_large': 'File is too large. Please choose a smaller file',
    'unsupported_file_type': 'File type not supported',
    
    // Generic errors
    'internal_error': 'Service temporarily unavailable. Please try again later',
    'timeout': 'Operation timed out. Please try again',
  };

  const errorMessage = error.message || error.error_description || String(error);
  
  // Check for specific error patterns
  for (const [pattern, friendlyMessage] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return friendlyMessage;
    }
  }
  
  // Special handling for Supabase errors
  if (error.code) {
    switch (error.code) {
      case 'PGRST116': return 'No data found';
      case 'PGRST301': return 'Multiple results found when expecting one';
      case '23505': return 'This information already exists';
      case '23503': return 'Cannot complete action due to related data';
      case '42501': return 'Access denied';
      default:
        // Don't expose internal error codes to users
        secureLog.warn('Unmapped error code', { code: error.code, message: errorMessage });
        return fallback;
    }
  }
  
  // For any unmapped errors, return the fallback
  secureLog.warn('Unmapped error type', { error: errorMessage });
  return fallback;
}

/**
 * Extract error code for internal handling
 */
export function getErrorCode(error: any): string | undefined {
  if (error?.code) return error.code;
  if (error?.status) return String(error.status);
  if (error?.name) return error.name;
  return undefined;
}

/**
 * Async error boundary wrapper
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<ErrorHandlingResult> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const result = handleError(error, context);
    return { ...result, data: fallbackValue };
  }
}

/**
 * Sync error boundary wrapper
 */
export function safeSync<T>(
  operation: () => T,
  context: string,
  fallbackValue?: T
): ErrorHandlingResult {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    const result = handleError(error, context);
    return { ...result, data: fallbackValue };
  }
}