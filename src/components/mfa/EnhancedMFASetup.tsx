import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Copy, Download, Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MFAStatus {
  enabled: boolean;
  secret?: string;
  qr_code?: string;
  backup_codes?: string[];
}

export const EnhancedMFASetup: React.FC = () => {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ enabled: false });
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'check' | 'setup' | 'verify' | 'complete'>('check');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      setLoading(true);
      // Simulated MFA status check - replace with actual implementation
      const mockMFAStatus = { enabled: false };
      
      setMfaStatus(mockMFAStatus);
      setStep(mockMFAStatus.enabled ? 'complete' : 'check');
      
      if (mockMFAStatus.enabled) {
        await fetchBackupCodes();
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
      toast({
        title: "Error",
        description: "Failed to check MFA status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupCodes = async () => {
    try {
      // Simulated backup codes - replace with actual implementation
      const mockBackupCodes = ['ABC123', 'DEF456', 'GHI789'];
      setBackupCodes(mockBackupCodes);
    } catch (error) {
      console.error('Error fetching backup codes:', error);
    }
  };

  const generateTOTPSecret = async () => {
    try {
      setLoading(true);
      // Generate TOTP secret - in a real implementation, this would be done server-side
      const secret = generateRandomSecret();
      const qrCode = generateQRCodeURL(secret);
      
      setMfaStatus({ 
        enabled: false, 
        secret,
        qr_code: qrCode 
      });
      setStep('setup');
    } catch (error) {
      console.error('Error generating TOTP secret:', error);
      toast({
        title: "Error",
        description: "Failed to generate MFA setup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Generate backup codes
      const generatedBackupCodes = generateBackupCodes();
      
      // Simulated MFA setup - replace with actual implementation
      // This would normally verify the TOTP code and enable MFA
      console.log('Setting up MFA with:', {
        secret: mfaStatus.secret,
        verificationCode,
        backupCodes: generatedBackupCodes
      });

      setBackupCodes(generatedBackupCodes);
      setMfaStatus({ enabled: true });
      setStep('complete');
      
      toast({
        title: "MFA Enabled",
        description: "Multi-factor authentication has been successfully enabled",
      });
    } catch (error) {
      console.error('Error enabling MFA:', error);
      toast({
        title: "Verification Failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    try {
      setLoading(true);
      // Simulated MFA disable - replace with actual implementation
      console.log('Disabling MFA with verification code:', verificationCode);

      setMfaStatus({ enabled: false });
      setBackupCodes([]);
      setStep('check');
      setVerificationCode('');
      
      toast({
        title: "MFA Disabled",
        description: "Multi-factor authentication has been disabled",
      });
    } catch (error) {
      console.error('Error disabling MFA:', error);
      toast({
        title: "Error",
        description: "Failed to disable MFA. Please check your verification code.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
      
      toast({
        title: "Copied",
        description: "Backup code copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateRandomSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateQRCodeURL = (secret: string): string => {
    const issuer = 'Chatterbox';
    const user = 'user@chatterbox.app'; // This would be the actual user email
    return `otpauth://totp/${issuer}:${user}?secret=${secret}&issuer=${issuer}`;
  };

  const generateBackupCodes = (): string[] => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const renderSetupStep = () => {
    switch (step) {
      case 'check':
        return (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Multi-factor authentication adds an extra layer of security to your account.
                You'll need an authenticator app like Google Authenticator or Authy.
              </AlertDescription>
            </Alert>
            
            <Button onClick={generateTOTPSecret} disabled={loading} className="w-full">
              <Smartphone className="h-4 w-4 mr-2" />
              Set Up MFA
            </Button>
          </div>
        );

      case 'setup':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium mb-2">Scan QR Code</h3>
              <div className="bg-white p-4 rounded-lg inline-block border">
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-sm text-gray-500">QR Code would appear here</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Scan this QR code with your authenticator app
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Or enter this secret manually:</label>
              <div className="flex gap-2">
                <Input value={mfaStatus.secret} readOnly className="font-mono text-xs" />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(mfaStatus.secret || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <Button onClick={() => setStep('verify')} className="w-full">
              Continue to Verification
            </Button>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Enter the 6-digit code from your authenticator app:
              </label>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('setup')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={verifyAndEnableMFA}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                Verify & Enable
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                MFA is enabled and protecting your account.
              </AlertDescription>
            </Alert>

            {backupCodes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Backup Recovery Codes
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadBackupCodes}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Save these codes in a safe place. Each can only be used once.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded font-mono text-xs"
                      >
                        <span>{code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedCode === code ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Disable MFA (requires verification code):</label>
              <div className="flex gap-2">
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="text-center"
                  maxLength={6}
                />
                <Button 
                  variant="destructive"
                  onClick={disableMFA}
                  disabled={loading || verificationCode.length !== 6}
                >
                  Disable
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Multi-Factor Authentication
          </div>
          <Badge variant={mfaStatus.enabled ? "default" : "secondary"}>
            {mfaStatus.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderSetupStep()}
      </CardContent>
    </Card>
  );
};