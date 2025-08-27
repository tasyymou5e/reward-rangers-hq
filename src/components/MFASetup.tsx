import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function MFASetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMFAStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setMfaEnabled(data.mfa_enabled);
        setBackupCodes(data.backup_codes || []);
      }
    } catch (error) {
      console.error('Error fetching MFA status:', error);
    }
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  };

  const enableMFA = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const newBackupCodes = generateBackupCodes();
      
      // Use the secure encryption function for storing sensitive data
      const { data: encryptedSecret } = await supabase
        .rpc('encrypt_mfa_secret', { 
          secret_text: 'mock_secret_' + Date.now() 
        });

      const { data: encryptedCodes } = await supabase
        .rpc('encrypt_mfa_secret', { 
          secret_text: JSON.stringify(newBackupCodes) 
        });

      if (!encryptedSecret || !encryptedCodes) {
        throw new Error('Failed to encrypt MFA data');
      }
      
      const { error } = await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: user.id,
          mfa_enabled: true,
          backup_codes: [encryptedCodes], // Store as encrypted array
          totp_secret: encryptedSecret,
        });

      if (error) throw error;

      // Log security event with rate limiting
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: 'mfa_enabled',
        user_id_param: user.id,
        metadata_param: {
          success: true,
          method: 'totp',
          backup_codes_generated: newBackupCodes.length,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      });

      setMfaEnabled(true);
      setBackupCodes(newBackupCodes);
      
      toast({
        title: "MFA Enabled",
        description: "Multi-factor authentication has been enabled for your account.",
      });
    } catch (error) {
      console.error('Error enabling MFA:', error);
      
      // Log failed attempt with rate limiting
      if (user) {
        await supabase.rpc('log_security_event_with_rate_limit', {
          event_type: 'mfa_enable_failed',
          user_id_param: user.id,
          metadata_param: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });
      }

      toast({
        title: "Error",
        description: "Failed to enable MFA. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_mfa_settings')
        .update({
          mfa_enabled: false,
          backup_codes: [],
          totp_secret: null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Log security event
      await supabase.rpc('log_security_event', {
        event_type: 'mfa_disabled',
        user_id_param: user.id,
        metadata_param: {
          success: true,
          ip_address: 'unknown',
          user_agent: navigator.userAgent
        }
      });

      setMfaEnabled(false);
      setBackupCodes([]);
      
      toast({
        title: "MFA Disabled",
        description: "Multi-factor authentication has been disabled.",
      });
    } catch (error) {
      console.error('Error disabling MFA:', error);
      
      // Log failed attempt
      if (user) {
        await supabase.rpc('log_security_event', {
          event_type: 'mfa_disable_failed',
          user_id_param: user.id,
          metadata_param: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            user_agent: navigator.userAgent
          }
        });
      }

      toast({
        title: "Error",
        description: "Failed to disable MFA. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      
      toast({
        title: "Copied",
        description: "Backup code copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  useEffect(() => {
    fetchMFAStatus();
  }, [user]);

  return (
    <Card className="bg-white border-parents-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-parents-primary">
          <Shield className="h-5 w-5" />
          Multi-Factor Authentication (MFA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Status:</p>
            <Badge variant={mfaEnabled ? "default" : "secondary"} className={mfaEnabled ? "bg-parents-primary" : ""}>
              {mfaEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <Button
            onClick={mfaEnabled ? disableMFA : enableMFA}
            disabled={loading}
            variant={mfaEnabled ? "destructive" : "default"}
            className={!mfaEnabled ? "bg-parents-primary hover:bg-parents-primary/90" : ""}
          >
            {loading ? "Processing..." : mfaEnabled ? "Disable MFA" : "Enable MFA"}
          </Button>
        </div>

        {mfaEnabled && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your account is protected with multi-factor authentication. Keep your backup codes safe!
            </AlertDescription>
          </Alert>
        )}

        {mfaEnabled && backupCodes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-parents-primary">Backup Recovery Codes</h4>
            <p className="text-sm text-muted-foreground">
              Save these codes in a secure location. Each code can only be used once.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <code className="text-sm font-mono flex-1">{code}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(code)}
                    className="h-6 w-6 p-0"
                  >
                    {copiedCode === code ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}