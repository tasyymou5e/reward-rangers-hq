import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Settings, Shield, Users } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface LoginControls {
  parents_login_enabled: boolean;
  kids_login_enabled: boolean;
  maintenance_message: string;
}

interface SystemMaintenance {
  enabled: boolean;
  message: string;
}

const AdminSystemSettings = () => {
  const [loginControls, setLoginControls] = useState<LoginControls>({
    parents_login_enabled: true,
    kids_login_enabled: true,
    maintenance_message: ""
  });
  const [systemMaintenance, setSystemMaintenance] = useState<SystemMaintenance>({
    enabled: false,
    message: "System is currently under maintenance. Please try again later."
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data: loginData, error: loginError } = await supabase
        .rpc('get_system_setting', { key_name: 'login_controls' });
      
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .rpc('get_system_setting', { key_name: 'system_maintenance' });

      if (loginError) throw loginError;
      if (maintenanceError) throw maintenanceError;

      if (loginData) {
        setLoginControls(loginData as unknown as LoginControls);
      }
      
      if (maintenanceData) {
        setSystemMaintenance(maintenanceData as unknown as SystemMaintenance);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLoginControls = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .rpc('update_system_setting', {
          key_name: 'login_controls',
          new_value: loginControls as any,
          setting_description: 'Controls which user types can log in to the system'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Login controls updated successfully"
      });
    } catch (error) {
      console.error('Error saving login controls:', error);
      toast({
        title: "Error",
        description: "Failed to update login controls",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSystemMaintenance = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .rpc('update_system_setting', {
          key_name: 'system_maintenance',
          new_value: systemMaintenance as any,
          setting_description: 'System-wide maintenance mode settings'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance settings updated successfully"
      });
    } catch (error) {
      console.error('Error saving maintenance settings:', error);
      toast({
        title: "Error",
        description: "Failed to update maintenance settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">System Settings</h1>
        </div>
        <div className="text-center py-8">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">System Settings</h1>
      </div>

      {/* Login Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Portal Access Controls</span>
          </CardTitle>
          <CardDescription>
            Control which user types can access their respective portals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="parents-login" className="text-base">
                Parents Portal Access
              </Label>
              <div className="text-sm text-muted-foreground">
                Allow parents to log in and access the parents portal
              </div>
            </div>
            <Switch
              id="parents-login"
              checked={loginControls.parents_login_enabled}
              onCheckedChange={(checked) =>
                setLoginControls(prev => ({ ...prev, parents_login_enabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="kids-login" className="text-base">
                Kids Portal Access
              </Label>
              <div className="text-sm text-muted-foreground">
                Allow kids to log in and access the kids portal
              </div>
            </div>
            <Switch
              id="kids-login"
              checked={loginControls.kids_login_enabled}
              onCheckedChange={(checked) =>
                setLoginControls(prev => ({ ...prev, kids_login_enabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Custom Message</Label>
            <Textarea
              id="maintenance-message"
              placeholder="Optional message to display when portals are disabled"
              value={loginControls.maintenance_message}
              onChange={(e) =>
                setLoginControls(prev => ({ ...prev, maintenance_message: e.target.value }))
              }
            />
          </div>

          <Button 
            onClick={saveLoginControls} 
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving..." : "Save Login Controls"}
          </Button>
        </CardContent>
      </Card>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>System Maintenance</span>
          </CardTitle>
          <CardDescription>
            Enable system-wide maintenance mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode" className="text-base">
                Maintenance Mode
              </Label>
              <div className="text-sm text-muted-foreground">
                Enable to display maintenance message site-wide
              </div>
            </div>
            <Switch
              id="maintenance-mode"
              checked={systemMaintenance.enabled}
              onCheckedChange={(checked) =>
                setSystemMaintenance(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-msg">Maintenance Message</Label>
            <Textarea
              id="maintenance-msg"
              placeholder="Message to display during maintenance"
              value={systemMaintenance.message}
              onChange={(e) =>
                setSystemMaintenance(prev => ({ ...prev, message: e.target.value }))
              }
            />
          </div>

          <Button 
            onClick={saveSystemMaintenance} 
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving..." : "Save Maintenance Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-warning">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            <span>Important Notice</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Disabling portal access will prevent users from logging in. Make sure to communicate
            any planned maintenance to your users before making changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSystemSettings;