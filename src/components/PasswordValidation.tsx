import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validatePasswordStrength } from '@/utils/securePasswordGenerator';

interface PasswordValidationProps {
  password: string;
  onValidationChange: (isValid: boolean) => void;
}

export function PasswordValidation({ password, onValidationChange }: PasswordValidationProps) {
  const [validation, setValidation] = useState({
    score: 0,
    isValid: false,
    feedback: [] as string[]
  });

  useEffect(() => {
    if (!password) {
      setValidation({ score: 0, isValid: false, feedback: [] });
      onValidationChange(false);
      return;
    }

    const result = validatePasswordStrength(password);
    setValidation({
      score: result.score,
      isValid: result.isValid,
      feedback: result.recommendations
    });
    onValidationChange(result.isValid && result.score >= 3);
  }, [password, onValidationChange]);

  const requirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Contains number', met: /\d/.test(password) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const getStrengthColor = (score: number) => {
    if (score < 2) return 'text-red-600';
    if (score < 3) return 'text-orange-500';
    if (score < 4) return 'text-yellow-500';
    return 'text-green-600';
  };

  const getStrengthText = (score: number) => {
    if (score < 2) return 'Weak';
    if (score < 3) return 'Fair';
    if (score < 4) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={`text-sm font-medium ${getStrengthColor(validation.score)}`}>
          {getStrengthText(validation.score)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <X className="h-3 w-3 text-red-500" />
            )}
            <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>

      {validation.feedback.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <ul className="list-disc list-inside space-y-1">
              {validation.feedback.map((feedback, index) => (
                <li key={index}>{feedback}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}