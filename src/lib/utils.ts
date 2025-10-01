import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse email to extract original email from timestamped format
 * Format: original+timestamp@domain.com -> original@domain.com
 */
export function parseTimestampedEmail(email: string): {
  original: string;
  current: string;
  isTimestamped: boolean;
} {
  if (!email || typeof email !== 'string') {
    return { original: email, current: email, isTimestamped: false };
  }

  // Check if email contains plus addressing with timestamp pattern
  const match = email.match(/^([^+@]+)\+(\d+)@(.+)$/);
  
  if (match && match[2].length === 13) { // Timestamp should be 13 digits
    const [, localPart, , domain] = match;
    return {
      original: `${localPart}@${domain}`,
      current: email,
      isTimestamped: true
    };
  }

  return {
    original: email,
    current: email,
    isTimestamped: false
  };
}
