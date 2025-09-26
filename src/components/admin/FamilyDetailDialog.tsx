import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Key, 
  UserPlus, 
  Shield, 
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { AddFamilyMemberDialog } from "./AddFamilyMemberDialog";
import { supabase } from "@/integrations/supabase/client";

interface FamilyDetailDialogProps {
  family: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function FamilyDetailDialog({ family, open, onOpenChange, onUpdate }: FamilyDetailDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddMember, setShowAddMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memberStates, setMemberStates] = useState<Record<string, boolean>>({});

  if (!family) return null;

  const handlePasswordReset = async (userId: string, userEmail: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          userId,
          action: 'reset_password',
          generatePassword: true,
          notifyUser: true
        }
      });

      if (error) throw error;

      toast({
        title: "Password Reset",
        description: `Password reset sent to ${userEmail}. Temporary password: ${data.tempPassword}`,
      });

      // Log security event
      await supabase.rpc('log_security_audit', {
        p_action_type: 'admin_password_reset',
        p_resource_type: 'user',
        p_resource_id: userId,
        p_risk_level: 'medium',
        p_metadata: { target_user_email: userEmail }
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, userEmail: string, currentlyActive: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-update-user', {
        body: {
          userId,
          action: currentlyActive ? 'disable_account' : 'enable_account'
        }
      });

      if (error) throw error;

      setMemberStates(prev => ({ ...prev, [userId]: !currentlyActive }));

      toast({
        title: currentlyActive ? "Account Disabled" : "Account Enabled",
        description: `${userEmail} account has been ${currentlyActive ? 'disabled' : 'enabled'}`,
      });

      // Log security event
      await supabase.rpc('log_security_audit', {
        p_action_type: currentlyActive ? 'admin_disable_account' : 'admin_enable_account',
        p_resource_type: 'user',
        p_resource_id: userId,
        p_risk_level: 'high',
        p_metadata: { target_user_email: userEmail, family_id: family.id }
      });

      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${currentlyActive ? 'disable' : 'enable'} account`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFamilyStatus = async (disable: boolean) => {
    setLoading(true);
    try {
      // Disable all family members
      const memberIds = [
        family.parent_id,
        ...(family.family_members?.map((m: any) => m.user_id) || [])
      ].filter(Boolean);

      for (const userId of memberIds) {
        await supabase.functions.invoke('admin-update-user', {
          body: {
            userId,
            action: disable ? 'disable_account' : 'enable_account'
          }
        });
      }

      toast({
        title: disable ? "Family Disabled" : "Family Enabled",
        description: `All members of ${family.name} have been ${disable ? 'disabled' : 'enabled'}`,
      });

      // Log security event
      await supabase.rpc('log_security_audit', {
        p_action_type: disable ? 'admin_disable_family' : 'admin_enable_family',
        p_resource_type: 'family',
        p_resource_id: family.id,
        p_risk_level: 'critical',
        p_metadata: { family_name: family.name, member_count: memberIds.length }
      });

      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${disable ? 'disable' : 'enable'} family`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const allMembers = [
    family.profiles && { 
      id: family.parent_id, 
      display_name: family.profiles.display_name, 
      email: family.profiles.email, 
      role: 'Parent' 
    },
    ...(family.family_members?.map((m: any) => ({
      id: m.user_id,
      display_name: m.profiles?.display_name || 'Unknown',
      email: m.profiles?.email || 'No email',
      role: m.profiles?.role === 'kid' ? 'Child' : m.profiles?.role || 'Unknown'
    })) || [])
  ].filter(Boolean);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {family.name}
              <Badge variant="secondary">{family.family_code}</Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Family Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{family.family_code}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{allMembers.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Created</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{new Date(family.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Family Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Description:</strong> {family.description || 'No description'}
                  </div>
                  <div>
                    <strong>Primary Email:</strong> {family.primary_email_designator || 'Not set'}
                  </div>
                  <div>
                    <strong>Email Domain:</strong> {family.email_domain || 'Default'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Family Members</h3>
                <Button 
                  onClick={() => setShowAddMember(true)}
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-2">
                {allMembers.map((member: any) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{member.display_name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <Badge variant={member.role === 'Parent' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePasswordReset(member.id, member.email)}
                            disabled={loading}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Reset Password
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={memberStates[member.id] === false ? "destructive" : "default"}
                            onClick={() => handleToggleUserStatus(
                              member.id, 
                              member.email, 
                              memberStates[member.id] !== false
                            )}
                            disabled={loading}
                          >
                            {memberStates[member.id] === false ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Enable
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Disable
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Family Controls
                    </CardTitle>
                    <CardDescription>
                      Manage access for the entire family
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="destructive"
                      onClick={() => handleToggleFamilyStatus(true)}
                      disabled={loading}
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Disable Entire Family
                    </Button>
                    
                    <Button
                      variant="default"
                      onClick={() => handleToggleFamilyStatus(false)}
                      disabled={loading}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enable Entire Family
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Security Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Account Status:</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Activity:</span>
                      <span className="text-sm text-muted-foreground">
                        {family.updated_at ? new Date(family.updated_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Alerts:</span>
                      <Badge variant="secondary">0</Badge>
                    </div>
                  </CardContent>
                </Card>
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
                  <p className="text-muted-foreground">
                    Activity tracking will be implemented in the next phase.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AddFamilyMemberDialog
        family={family}
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onSuccess={() => {
          setShowAddMember(false);
          onUpdate();
        }}
      />
    </>
  );
}