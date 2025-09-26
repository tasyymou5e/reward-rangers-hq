/**
 * Leaked password checking utility for enhanced security
 * CRITICAL: Enable leaked password protection in Supabase Auth settings
 */

/**
 * Check if password has been compromised in data breaches
 * Uses SHA-1 hash with k-anonymity for privacy
 */
export async function checkPasswordBreach(password: string): Promise<boolean> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Use k-anonymity: send only first 5 characters
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    // Query HaveIBeenPwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true' // Enhanced privacy
      }
    });
    
    if (!response.ok) {
      // If API is unavailable, use local common password list as fallback
      return isCommonPasswordLocal(password);
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // Check if our suffix appears in the results
    for (const line of lines) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix === suffix) {
        return true; // Password found in breach database
      }
    }
    
    return false; // Password not found in breaches
    
  } catch (error) {
    console.warn('Password breach check failed, falling back to local validation:', error);
    // Fallback to local common password checking
    return isCommonPasswordLocal(password);
  }
}

/**
 * Local fallback for common password checking
 */
function isCommonPasswordLocal(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'pass', 'mustang', 'master', 'shadow',
    'jesus', 'superman', 'hello', 'charlie', 'freedom',
    'whatever', 'trustno1', 'jordan23', 'harley', 'robert',
    'matthew', 'jordan', 'asshole', 'daniel'
  ];
  
  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(common => 
    lowerPassword.includes(common) || common.includes(lowerPassword)
  );
}

/**
 * Enhanced password validation with breach checking ENABLED
 * IMPORTANT: Enable leaked password protection in Supabase Auth settings
 */
export async function validatePasswordSecurity(password: string) {
  const basicChecks = {
    length: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSymbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    noCommonPatterns: !/(.)\1{2,}/.test(password),
    notTooLong: password.length <= 128,
    noCommonWords: !isCommonPasswordLocal(password),
  };
  
  // Enable breach checking for enhanced security
  let isBreached = false;
  try {
    isBreached = await checkPasswordBreach(password);
  } catch (error) {
    console.warn('Breach check failed, using local validation only:', error);
    // If breach check fails, we still validate other requirements
  }
  
  const enhancedChecks = {
    ...basicChecks,
    notBreached: !isBreached
  };
  
  const score = Object.values(enhancedChecks).filter(Boolean).length;
  const isValid = score >= 7 && enhancedChecks.length && enhancedChecks.hasLowercase && 
                  enhancedChecks.hasUppercase && enhancedChecks.hasNumbers && 
                  enhancedChecks.hasSymbols && enhancedChecks.notBreached;
  
  return {
    isValid,
    score,
    checks: enhancedChecks,
    isBreached,
    recommendations: [
      !enhancedChecks.length && 'Use at least 8 characters',
      !enhancedChecks.hasLowercase && 'Include lowercase letters',
      !enhancedChecks.hasUppercase && 'Include uppercase letters', 
      !enhancedChecks.hasNumbers && 'Include numbers',
      !enhancedChecks.hasSymbols && 'Include special characters',
      !enhancedChecks.noCommonPatterns && 'Avoid repeating characters',
      !enhancedChecks.noCommonWords && 'Avoid common passwords',
      !enhancedChecks.notTooLong && 'Password too long (max 128 characters)',
      isBreached && 'Password found in data breaches - choose a different one',
    ].filter(Boolean),
  };
}