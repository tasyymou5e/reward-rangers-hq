import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { validatePasswordSecurity } from '@/utils/leakedPasswordChecker';

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange: (isValid: boolean) => void;
  showDetailedFeedback?: boolean;
}

/**
 * Enhanced password strength indicator following security framework guidelines
 * Implements comprehensive password validation with visual feedback
 */
export function PasswordStrengthIndicator({ 
  password, 
  onValidationChange, 
  showDetailedFeedback = true 
}: PasswordStrengthIndicatorProps) {
  const [validation, setValidation] = useState({
    score: 0,
    isValid: false,
    feedback: [] as string[],
    checks: {} as any,
    isBreached: false
  });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!password) {
      setValidation({ score: 0, isValid: false, feedback: [], checks: {}, isBreached: false });
      onValidationChange(false);
      return;
    }

    const checkPassword = async () => {
      setIsChecking(true);
      try {
        const result = await validatePasswordSecurity(password);
        setValidation({
          score: result.score,
          isValid: result.isValid,
          feedback: result.recommendations,
          checks: result.checks,
          isBreached: result.isBreached
        });
        onValidationChange(result.isValid);
      } catch (error) {
        console.warn('Password security check failed, using basic validation:', error);
        // Fallback to basic validation if security check fails
        const { validatePasswordStrength } = await import('@/utils/securePasswordGenerator');
        const result = validatePasswordStrength(password);
        setValidation({
          score: result.score,
          isValid: result.isValid,
          feedback: result.recommendations,
          checks: result.checks,
          isBreached: false
        });
        onValidationChange(result.isValid);
      } finally {
        setIsChecking(false);
      }
    };

    checkPassword();
  }, [password, onValidationChange]);

  const getStrengthColor = (score: number) => {
    if (score < 3) return 'hsl(var(--destructive))';
    if (score < 5) return 'hsl(var(--orange-500))';
    if (score < 7) return 'hsl(var(--yellow-600))';
    return 'hsl(var(--green-600))';
  };

  const getStrengthText = (score: number) => {
    if (score < 3) return 'Weak';
    if (score < 5) return 'Fair';
    if (score < 7) return 'Good';
    return 'Strong';
  };

  const getStrengthProgress = (score: number) => {
    return Math.min((score / 9) * 100, 100); // 9 is max score
  };

  if (!password) return null;

  const requirements = [
    { 
      text: 'At least 8 characters', 
      met: validation.checks.length,
      critical: true 
    },
    { 
      text: 'Contains uppercase letter', 
      met: validation.checks.hasUppercase,
      critical: true 
    },
    { 
      text: 'Contains lowercase letter', 
      met: validation.checks.hasLowercase,
      critical: true 
    },
    { 
      text: 'Contains number', 
      met: validation.checks.hasNumbers,
      critical: true 
    },
    { 
      text: 'Contains special character', 
      met: validation.checks.hasSymbols,
      critical: true 
    },
    { 
      text: 'No repeating patterns', 
      met: validation.checks.noCommonPatterns,
      critical: false 
    },
    { 
      text: 'Not a common password', 
      met: validation.checks.noCommonWords,
      critical: false 
    },
    { 
      text: 'Not found in data breaches', 
      met: validation.checks.notBreached,
      critical: true 
    },
  ];

  return (
    <div className="space-y-4">
      {/* Strength Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Password Strength
            </span>
            {isChecking && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <span 
            className="text-sm font-semibold"
            style={{ color: getStrengthColor(validation.score) }}
          >
            {getStrengthText(validation.score)}
          </span>
        </div>
        
        <Progress 
          value={getStrengthProgress(validation.score)}
          className="h-2"
        />
      </div>

      {showDetailedFeedback && (
        <>
          {/* Requirements Checklist */}
          <div className="grid grid-cols-1 gap-1">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                {req.met ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className={`h-3 w-3 ${req.critical ? 'text-destructive' : 'text-muted-foreground'}`} />
                )}
                <span className={
                  req.met 
                    ? 'text-green-600' 
                    : req.critical 
                    ? 'text-destructive' 
                    : 'text-muted-foreground'
                }>
                  {req.text} {req.critical && '*'}
                </span>
              </div>
            ))}
          </div>

          {/* Security Feedback */}
          {validation.feedback.length > 0 && (
            <Alert variant={validation.isValid ? "default" : "destructive"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <div className="font-medium mb-1">Security Recommendations:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.feedback.map((feedback, index) => (
                    <li key={index}>{feedback}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Breach Warning */}
          {validation.isBreached && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Security Warning:</strong> This password has been found in data breaches. 
                Please choose a different password for your safety.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          {validation.isValid && !validation.isBreached && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs text-green-700">
                Password meets security requirements and is not found in known breaches.
                {password.length >= 12 && " Excellent length for enhanced security!"}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}