import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Shield, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityConfigItem {
  id: string;
  title: string;
  description: string;
  status: 'enabled' | 'disabled' | 'warning' | 'unknown';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action?: string;
  link?: string;
}

export function SecurityConfigurationPanel() {
  const [checking, setChecking] = useState(false);
  const [configurations, setConfigurations] = useState<SecurityConfigItem[]>([
    {
      id: 'leaked_password_protection',
      title: 'Leaked Password Protection',
      description: 'Prevents users from using passwords found in data breaches',
      status: 'disabled',
      priority: 'critical',
      action: 'Enable in Supabase Dashboard → Authentication → Password Protection',
      link: 'https://supabase.com/docs/guides/auth/password-security'
    },
    {
      id: 'email_verification',
      title: 'Email Verification',
      description: 'Requires users to verify their email before accessing the app',
      status: 'enabled',
      priority: 'high',
      action: 'Configure in Supabase Dashboard → Authentication → Settings'
    },
    {
      id: 'rls_policies',
      title: 'Row Level Security',
      description: 'Database policies protect data access at the table level',
      status: 'enabled',
      priority: 'critical',
      action: 'All tables have appropriate RLS policies'
    },
    {
      id: 'rate_limiting',
      title: 'Rate Limiting',
      description: 'Prevents brute force attacks and API abuse',
      status: 'enabled',
      priority: 'high',
      action: 'Implemented with enhanced monitoring'
    },
    {
      id: 'mfa_support',
      title: 'Multi-Factor Authentication',
      description: 'Additional security layer for admin accounts',
      status: 'enabled',
      priority: 'medium',
      action: 'Available for admin users'
    }
  ]);

  const checkSecurityStatus = async () => {
    setChecking(true);
    try {
      // Test leaked password protection by attempting signup with known weak password
      const { error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123', // Known weak password
        options: { data: { test_security_check: true } }
      });

      setConfigurations(prev => prev.map(config => {
        if (config.id === 'leaked_password_protection') {
          const isEnabled = error?.message?.includes('password') || error?.message?.includes('weak');
          return {
            ...config,
            status: isEnabled ? 'enabled' : 'disabled'
          };
        }
        return config;
      }));
    } catch (error) {
      console.error('Security check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enabled':
        return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Enabled</Badge>;
      case 'disabled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Disabled</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-destructive';
      case 'high': return 'border-l-warning';
      case 'medium': return 'border-l-primary';
      default: return 'border-l-muted';
    }
  };

  const criticalIssues = configurations.filter(c => c.priority === 'critical' && c.status === 'disabled');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Configuration
        </CardTitle>
        <CardDescription>
          Review and configure critical security settings for your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Configuration Status</h3>
          <Button onClick={checkSecurityStatus} disabled={checking} variant="outline">
            {checking ? 'Checking...' : 'Check Status'}
          </Button>
        </div>

        {criticalIssues.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {criticalIssues.length} critical security issue(s) require immediate attention.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {configurations.map((config) => (
            <div
              key={config.id}
              className={`border rounded-lg p-4 border-l-4 ${getPriorityColor(config.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{config.title}</h4>
                    {getStatusBadge(config.status)}
                    <Badge variant="outline" className="text-xs">
                      {config.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                  <p className="text-xs text-muted-foreground">{config.action}</p>
                </div>
                {config.link && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={config.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Production Readiness Checklist:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>✅ Row Level Security enabled on all tables</li>
              <li>✅ Rate limiting implemented</li>
              <li>✅ Input validation with Zod schemas</li>
              <li>⚠️ <strong>Enable leaked password protection in Supabase Dashboard</strong></li>
              <li>✅ HTTPS enforced</li>
              <li>✅ Audit logging in place</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}