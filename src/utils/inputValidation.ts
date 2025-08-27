/**
 * Comprehensive input validation utilities for security
 */

// Common validation patterns
const PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  familyCode: /^[A-Z0-9]{6,12}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

// Input length limits
const LIMITS = {
  username: { min: 3, max: 20 },
  displayName: { min: 1, max: 50 },
  email: { min: 5, max: 254 },
  password: { min: 8, max: 128 },
  choreTitle: { min: 1, max: 100 },
  choreDescription: { max: 500 },
  wishlistTitle: { min: 1, max: 100 },
  wishlistDescription: { max: 500 },
  familyName: { min: 1, max: 50 },
  message: { min: 1, max: 1000 }
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

/**
 * Validates and sanitizes email input
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length < LIMITS.email.min || trimmed.length > LIMITS.email.max) {
    errors.push(`Email must be between ${LIMITS.email.min} and ${LIMITS.email.max} characters`);
  }
  
  if (!PATTERNS.email.test(trimmed)) {
    errors.push('Please enter a valid email address');
  }
  
  // Check for suspicious patterns
  if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
    errors.push('Email format is invalid');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed
  };
}

/**
 * Validates username input
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { isValid: false, errors };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < LIMITS.username.min || trimmed.length > LIMITS.username.max) {
    errors.push(`Username must be between ${LIMITS.username.min} and ${LIMITS.username.max} characters`);
  }
  
  if (!PATTERNS.username.test(trimmed)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  // Check for reserved usernames
  const reservedUsernames = ['admin', 'root', 'system', 'api', 'www', 'mail', 'ftp'];
  if (reservedUsernames.includes(trimmed.toLowerCase())) {
    errors.push('This username is not available');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed
  };
}

/**
 * Validates display name input
 */
export function validateDisplayName(displayName: string): ValidationResult {
  const errors: string[] = [];
  
  if (!displayName || typeof displayName !== 'string') {
    errors.push('Display name is required');
    return { isValid: false, errors };
  }
  
  const trimmed = displayName.trim();
  
  if (trimmed.length < LIMITS.displayName.min || trimmed.length > LIMITS.displayName.max) {
    errors.push(`Display name must be between ${LIMITS.displayName.min} and ${LIMITS.displayName.max} characters`);
  }
  
  // Remove potentially dangerous characters
  const sanitized = trimmed.replace(/[<>\"'&]/g, '');
  
  if (sanitized !== trimmed) {
    errors.push('Display name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validates family code input
 */
export function validateFamilyCode(code: string): ValidationResult {
  const errors: string[] = [];
  
  if (!code || typeof code !== 'string') {
    errors.push('Family code is required');
    return { isValid: false, errors };
  }
  
  const trimmed = code.trim().toUpperCase();
  
  if (!PATTERNS.familyCode.test(trimmed)) {
    errors.push('Family code must be 6-12 alphanumeric characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed
  };
}

/**
 * Validates points value
 */
export function validatePoints(points: number | string): ValidationResult {
  const errors: string[] = [];
  
  const numPoints = typeof points === 'string' ? parseInt(points, 10) : points;
  
  if (isNaN(numPoints)) {
    errors.push('Points must be a valid number');
    return { isValid: false, errors };
  }
  
  if (numPoints < 1 || numPoints > 1000) {
    errors.push('Points must be between 1 and 1000');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: numPoints
  };
}

/**
 * Validates URL input
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];
  
  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { isValid: false, errors };
  }
  
  const trimmed = url.trim();
  
  if (!PATTERNS.url.test(trimmed)) {
    errors.push('Please enter a valid URL');
  }
  
  // Ensure HTTPS for security
  if (!trimmed.startsWith('https://')) {
    errors.push('URL must use HTTPS');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed
  };
}

/**
 * Sanitizes text input to prevent XSS
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .substring(0, maxLength)
    .replace(/[<>\"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    });
}

/**
 * Validates UUID format
 */
export function validateUuid(uuid: string): ValidationResult {
  const errors: string[] = [];
  
  if (!uuid || typeof uuid !== 'string') {
    errors.push('ID is required');
    return { isValid: false, errors };
  }
  
  if (!PATTERNS.uuid.test(uuid)) {
    errors.push('Invalid ID format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: uuid
  };
}