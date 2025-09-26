import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, ExternalLink, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecurityConfigItem {
  id: string;
  title: string;
  description: string;
  status: 'enabled' | 'disabled' | 'unknown';
  priority: 'critical' | 'high' | 'medium';
  action: string;
  link?: string;
}

export function SecurityConfigurationPanel() {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [configurations, setConfigurations] = useState<SecurityConfigItem[]>([
    {
      id: 'leaked_password',
      title: 'Leaked Password Protection',
      description: 'Prevents users from using passwords found in data breaches',
      status: 'unknown',
      priority: 'critical',
      action: 'Enable in Supabase Auth Settings',
      link: 'https://supabase.com/dashboard/project/rdvkwnoeojjvjuknlsjd/auth/providers'
    },
    {
      id: 'email_verification',
      title: 'Email Verification Required',
      description: 'Requires users to verify their email address before accessing the app',
      status: 'unknown',
      priority: 'high',
      action: 'Configure email verification',
      link: 'https://supabase.com/dashboard/project/rdvkwnoeojjvjuknlsjd/auth/providers'
    },
    {
      id: 'session_timeout',
      title: 'Session Timeout Configuration',
      description: 'Automatic session expiration for enhanced security',
      status: 'unknown',
      priority: 'medium',
      action: 'Configure session settings',
      link: 'https://supabase.com/dashboard/project/rdvkwnoeojjvjuknlsjd/auth/providers'
    }
  ]);

  const checkSecurityStatus = async () => {
    setChecking(true);
    try {
      // Test password validation to check if leaked password protection is working
      const testResult = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123' // Common leaked password
      });
      
      // Update configurations based on response
      setConfigurations(prev => prev.map(config => {
        if (config.id === 'leaked_password') {
          return {
            ...config,
            status: testResult.error?.message?.includes('password') ? 'enabled' : 'disabled'
          };
        }
        return config;
      }));

      toast({
        title: "Security Status Checked",
        description: "Security configuration status updated",
      });
    } catch (error) {
      console.error('Error checking security status:', error);
      toast({
        title: "Check Failed",
        description: "Could not verify security settings",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const getStatusBadge = (status: string, priority: string) => {
    switch (status) {
      case 'enabled':
        return <Badge variant="default" className="bg-green-500">Enabled</Badge>;
      case 'disabled':
        return <Badge variant="destructive">Disabled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'hsl(var(--destructive))';
      case 'high':
        return 'hsl(var(--orange-500))';
      default:
        return 'hsl(var(--yellow-600))';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Security Configuration</CardTitle>
          </div>
          <Button 
            onClick={checkSecurityStatus}
            disabled={checking}
            variant="outline"
            size="sm"
          >
            {checking ? 'Checking...' : 'Check Status'}
          </Button>
        </div>
        <CardDescription>
          Critical security settings that must be enabled for production deployment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {configurations.map((config) => (
          <div key={config.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{config.title}</h4>
                  {getStatusBadge(config.status, config.priority)}
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPriorityColor(config.priority) }}
                    title={`${config.priority} priority`}
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {config.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Action: {config.action}
                  </span>
                  {config.link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => window.open(config.link, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Critical Security Notice:</strong> Enable leaked password protection 
            in your Supabase dashboard under Authentication → Settings → Password Protection.
            This is required for A+ security grade and production deployment.
          </AlertDescription>
        </Alert>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Production Readiness Checklist
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✅ RLS policies enabled on all tables</li>
            <li>✅ Edge functions configured with proper CORS</li>
            <li>✅ Email routing system implemented</li>
            <li>✅ Family migration tools available</li>
            <li className="text-orange-600">⚠️ Leaked password protection (manual setup required)</li>
            <li className="text-orange-600">⚠️ Email service domain verification</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}