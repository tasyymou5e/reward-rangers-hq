import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key, Copy, Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UserPasswordResetDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserPasswordResetDialog({ user, open, onOpenChange, onSuccess }: UserPasswordResetDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);
  const [forceChange, setForceChange] = useState(true);

  const generateSecurePassword = () => {
    const length = 16;
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each required character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setGeneratedPassword(newPassword);
    toast({
      title: "Password Generated",
      description: "Secure password has been generated",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Password copied to clipboard",
    });
  };

  const handleResetPassword = async () => {
    const passwordToUse = useCustomPassword ? customPassword : generatedPassword;
    
    if (!passwordToUse) {
      toast({
        title: "Error",
        description: "Please generate or enter a password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          userId: user.id,
          action: 'reset_password',
          password: passwordToUse,
          notifyUser,
          forceChange
        }
      });

      if (error) throw error;

      toast({
        title: "Password Reset Successful",
        description: `Password has been reset for ${user.email}`,
      });

      // Log security event
      await supabase.rpc('log_security_audit', {
        p_action_type: 'admin_password_reset',
        p_resource_type: 'user',
        p_resource_id: user.id,
        p_risk_level: 'high',
        p_metadata: {
          target_user_email: user.email,
          notify_user: notifyUser,
          force_change: forceChange
        }
      });

      onSuccess();
      onOpenChange(false);
      
      // Clear passwords
      setGeneratedPassword("");
      setCustomPassword("");
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Reset Password for {user?.display_name || user?.email}
          </DialogTitle>
          <DialogDescription>
            Generate a secure password or set a custom password for this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Password Generation Section */}
          <Card className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Generate Secure Password</Label>
                <Button
                  onClick={handleGeneratePassword}
                  variant="outline"
                  size="sm"
                  disabled={useCustomPassword}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>

              {generatedPassword && (
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedPassword}
                    readOnly
                    className="font-mono text-lg"
                  />
                  <Button
                    onClick={() => copyToClipboard(generatedPassword)}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Password Section */}
          <Card className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-password" className="text-base font-semibold">
                  Or Set Custom Password
                </Label>
                <Switch
                  checked={useCustomPassword}
                  onCheckedChange={setUseCustomPassword}
                />
              </div>

              {useCustomPassword && (
                <div>
                  <Input
                    id="custom-password"
                    type="password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Enter custom password (min 8 characters)"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify-user" className="text-base">Send Email Notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify user via email with their new password
                  </p>
                </div>
                <Switch
                  id="notify-user"
                  checked={notifyUser}
                  onCheckedChange={setNotifyUser}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="force-change" className="text-base">Force Password Change</Label>
                  <p className="text-sm text-muted-foreground">
                    Require user to change password on next login
                  </p>
                </div>
                <Switch
                  id="force-change"
                  checked={forceChange}
                  onCheckedChange={setForceChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Security Warning</p>
              <p>This action will immediately reset the user's password. Make sure to securely communicate the new password to the user.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            disabled={loading || (!generatedPassword && !useCustomPassword) || (useCustomPassword && !customPassword)}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
