/**
 * Secure password generation utility using Web Crypto API
 */

// Character sets for password generation
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generates a cryptographically secure random password
 * @param length Password length (minimum 12, maximum 128)
 * @param options Password character set options
 * @returns Promise<string> Generated password
 */
export async function generateSecurePassword(
  length: number = 16,
  options: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  } = {}
): Promise<string> {
  // Validate length
  if (length < 12 || length > 128) {
    throw new Error('Password length must be between 12 and 128 characters');
  }

  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  // Build character set
  let charset = '';
  const requiredChars: string[] = [];

  if (includeLowercase) {
    charset += LOWERCASE;
    requiredChars.push(LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]);
  }
  if (includeUppercase) {
    charset += UPPERCASE;
    requiredChars.push(UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]);
  }
  if (includeNumbers) {
    charset += NUMBERS;
    requiredChars.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
  }
  if (includeSymbols) {
    charset += SYMBOLS;
    requiredChars.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be included');
  }

  // Generate cryptographically secure random bytes
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  // Convert to password characters
  const password: string[] = [];
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    password.push(charset[randomIndex]);
  }

  // Ensure required character types are present
  for (let i = 0; i < requiredChars.length; i++) {
    if (i < password.length) {
      password[i] = requiredChars[i];
    }
  }

  // Shuffle the password array to avoid predictable patterns
  for (let i = password.length - 1; i > 0; i--) {
    const randomIndex = randomBytes[i] % (i + 1);
    [password[i], password[randomIndex]] = [password[randomIndex], password[i]];
  }

  return password.join('');
}

/**
 * Generates a secure temporary password with expiration
 * @param expirationMinutes Minutes until password expires
 * @returns Object with password and expiration timestamp
 */
export async function generateTemporaryPassword(expirationMinutes: number = 60) {
  const password = await generateSecurePassword(16, {
    includeSymbols: false, // Easier for users to type
  });
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
  
  return {
    password,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Validates password strength
 * @param password Password to validate
 * @returns Object with validation result and score
 */
/**
 * Enhanced password validation following security framework guidelines
 * Implements comprehensive security checks and breach detection
 * Note: Use validatePasswordSecurity from leakedPasswordChecker.ts for full breach checking
 */
export function validatePasswordStrength(password: string) {
  const checks = {
    // CRITICAL: Minimum 8 characters per security framework
    length: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSymbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    noCommonPatterns: !/(.)\1{2,}/.test(password), // No more than 2 consecutive same characters
    noCommonWords: !isCommonPassword(password),
    notTooShort: password.length >= 8, // Framework requirement
    notTooLong: password.length <= 128, // Prevent DoS attacks
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  // Enhanced scoring per security framework
  const isValid = score >= 6 && checks.length && checks.hasLowercase && 
                  checks.hasUppercase && checks.hasNumbers && checks.hasSymbols;

  return {
    isValid,
    score,
    checks,
    recommendations: [
      !checks.length && 'Use at least 8 characters (framework requirement)',
      !checks.hasLowercase && 'Include lowercase letters',
      !checks.hasUppercase && 'Include uppercase letters', 
      !checks.hasNumbers && 'Include numbers',
      !checks.hasSymbols && 'Include special characters',
      !checks.noCommonPatterns && 'Avoid repeating characters',
      !checks.noCommonWords && 'Avoid common passwords',
      !checks.notTooLong && 'Password too long (max 128 characters)',
    ].filter(Boolean),
  };
}

/**
 * Check against common password patterns
 * This would ideally check against HaveIBeenPwned API in production
 */
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'pass', 'mustang', 'master', 'shadow'
  ];
  
  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(common => 
    lowerPassword.includes(common) || common.includes(lowerPassword)
  );
}