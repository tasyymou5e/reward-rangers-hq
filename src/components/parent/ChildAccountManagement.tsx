import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useChildManagement } from "@/hooks/useChildManagement";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Settings, 
  Shield, 
  Clock, 
  MessageSquare, 
  Key,
  UserPlus,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";

export function ChildAccountManagement() {
  const {
    children,
    childSettings,
    joinRequests,
    loading,
    updateChildSettings,
    resetChildPassword,
    processJoinRequest
  } = useChildManagement();

  const { toast } = useToast();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [passwordReset, setPasswordReset] = useState({ childId: '', newPassword: '' });
  const [settingsDialog, setSettingsDialog] = useState(false);

  const handlePasswordReset = async () => {
    if (!passwordReset.childId || !passwordReset.newPassword) return;

    try {
      await resetChildPassword(passwordReset.childId, passwordReset.newPassword);
      toast({
        title: "Password Reset",
        description: "Child password has been updated successfully.",
      });
      setPasswordReset({ childId: '', newPassword: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSettingsUpdate = async (childId: string, newSettings: any) => {
    try {
      await updateChildSettings(childId, newSettings);
      toast({
        title: "Settings Updated",
        description: "Child account settings have been saved.",
      });
      setSettingsDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await processJoinRequest(requestId, action);
      toast({
        title: action === 'approve' ? "Request Approved" : "Request Rejected",
        description: `Family join request has been ${action}d.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getChildSettings = (childId: string) => {
    return childSettings[childId] || {
      password_policy: { min_length: 6, require_parent_approval: true },
      screen_time_limits: {},
      content_restrictions: {},
      communication_settings: { allow_family_chat: true, moderated: true },
      safety_settings: { share_activity_with_parent: true }
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">👨‍👩‍👧‍👦</div>
          <p className="text-lg">Loading child management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Join Requests */}
      {joinRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Family Join Requests ({joinRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {joinRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {request.requester_profile?.display_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.requester_profile?.email}
                      </div>
                      {request.message && (
                        <div className="text-sm mt-1 italic">
                          "{request.message}"
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleJoinRequest(request.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinRequest(request.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Children Overview */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Children Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings & Controls</TabsTrigger>
          <TabsTrigger value="activity">Activity Monitoring</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{child.display_name}</CardTitle>
                    <Badge variant="secondary">Level {child.level}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{child.username}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Points:</span>
                      <div className="font-medium">{child.points}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Streak:</span>
                      <div className="font-medium">{child.streak_days} days</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Last active: {new Date(child.last_activity).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setPasswordReset({ ...passwordReset, childId: child.id })}
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Reset Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Password for {child.display_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordReset.newPassword}
                              onChange={(e) => setPasswordReset({ ...passwordReset, newPassword: e.target.value })}
                              placeholder="Enter new password"
                            />
                          </div>
                          <Button 
                            onClick={handlePasswordReset}
                            disabled={!passwordReset.newPassword}
                          >
                            Update Password
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedChild(child.id)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Settings
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Settings for {child.display_name}</DialogTitle>
                        </DialogHeader>
                        <ChildSettingsForm
                          child={child}
                          settings={getChildSettings(child.id)}
                          onSave={(newSettings) => handleSettingsUpdate(child.id, newSettings)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parental Controls Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Password Policies</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• Minimum 6 characters required</div>
                    <div>• Parent approval required for changes</div>
                    <div>• Automatic reset available</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Communication Settings</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• Family chat moderated by default</div>
                    <div>• External communication restricted</div>
                    <div>• Activity sharing with parents enabled</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
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
                {children.map((child) => (
                  <div key={child.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{child.display_name}</span>
                      <span className="text-sm text-muted-foreground">
                        Last seen: {new Date(child.last_activity).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Recent activity monitoring available in child settings
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Child Settings Form Component
function ChildSettingsForm({ child, settings, onSave }: {
  child: any;
  settings: any;
  onSave: (settings: any) => void;
}) {
  const [formSettings, setFormSettings] = useState(settings);

  const updateSetting = (category: string, key: string, value: any) => {
    setFormSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Safety Settings */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Safety Settings
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="activity-sharing">Share activity with parent</Label>
            <Switch
              id="activity-sharing"
              checked={formSettings.safety_settings?.share_activity_with_parent}
              onCheckedChange={(checked) => updateSetting('safety_settings', 'share_activity_with_parent', checked)}
            />
          </div>
        </div>
      </div>

      {/* Communication Settings */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Communication Settings
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="family-chat">Allow family chat</Label>
            <Switch
              id="family-chat"
              checked={formSettings.communication_settings?.allow_family_chat}
              onCheckedChange={(checked) => updateSetting('communication_settings', 'allow_family_chat', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="moderated">Moderate messages</Label>
            <Switch
              id="moderated"
              checked={formSettings.communication_settings?.moderated}
              onCheckedChange={(checked) => updateSetting('communication_settings', 'moderated', checked)}
            />
          </div>
        </div>
      </div>

      {/* Screen Time Limits */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Screen Time Limits
        </h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="daily-limit">Daily limit (minutes)</Label>
            <Input
              id="daily-limit"
              type="number"
              value={formSettings.screen_time_limits?.daily_minutes || ''}
              onChange={(e) => updateSetting('screen_time_limits', 'daily_minutes', parseInt(e.target.value) || 0)}
              placeholder="No limit set"
            />
          </div>
        </div>
      </div>

      <Button onClick={() => onSave(formSettings)}>
        Save Settings
      </Button>
    </div>
  );
}