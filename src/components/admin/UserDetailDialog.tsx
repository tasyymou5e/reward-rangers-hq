import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Key, 
  Shield, 
  Activity,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";
import { UserPasswordResetDialog } from "./UserPasswordResetDialog";
import { EmailDisplay } from "./EmailDisplay";
import { supabase } from "@/integrations/supabase/client";

interface UserDetailDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function UserDetailDialog({ user, open, onOpenChange, onUpdate }: UserDetailDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) return null;

  const handleToggleUserStatus = async (disable: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          userId: user.id,
          action: disable ? 'disable_account' : 'enable_account'
        }
      });

      if (error) throw error;

      toast({
        title: disable ? "Account Disabled" : "Account Enabled",
        description: `${user.email} has been ${disable ? 'disabled' : 'enabled'}`,
      });

      // Log security event
      await supabase.rpc('log_security_audit', {
        p_action_type: disable ? 'admin_disable_user' : 'admin_enable_user',
        p_resource_type: 'user',
        p_resource_id: user.id,
        p_risk_level: 'high',
        p_metadata: {
          target_user_email: user.email,
          previous_status: !disable ? 'active' : 'disabled'
        }
      });

      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${disable ? 'disable' : 'enable'} account`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {user.display_name}
              <Badge variant={
                ['admin', 'full_admin'].includes(user.role) ? 'destructive' :
                user.role === 'parent' ? 'default' : 'secondary'
              }>
                {user.role}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* User Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmailDisplay email={user.email} />
                    {user.email_alias && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Email Alias:</p>
                        <p className="text-sm font-mono">{user.email_alias}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg">{user.username}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={user.email_verified ? "default" : "secondary"}>
                      {user.email_verified ? "Verified" : "Not Verified"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Created</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Points</p>
                      <p className="text-2xl font-bold">{user.points || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Level</p>
                      <p className="text-2xl font-bold">{user.level || 1}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Streak</p>
                      <p className="text-2xl font-bold">{user.streak_days || 0} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Password Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setShowPasswordReset(true)}
                    disabled={loading}
                    className="w-full"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="destructive"
                    onClick={() => handleToggleUserStatus(true)}
                    disabled={loading}
                    className="w-full"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Disable Account
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={() => handleToggleUserStatus(false)}
                    disabled={loading}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Enable Account
                  </Button>
                </CardContent>
              </Card>

              {/* Security Warning */}
              <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">Security Actions</p>
                  <p>All security actions are logged and audited. These operations affect user access immediately.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Activity:</span>
                      <span className="font-medium">
                        {user.last_activity 
                          ? new Date(user.last_activity).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account Created:</span>
                      <span className="font-medium">
                        {new Date(user.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">
                        {new Date(user.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <UserPasswordResetDialog
        user={user}
        open={showPasswordReset}
        onOpenChange={setShowPasswordReset}
        onSuccess={onUpdate}
      />
    </>
  );
}
