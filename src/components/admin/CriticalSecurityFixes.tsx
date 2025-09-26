import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  description: string;
  resolved: boolean;
  created_at: string;
}

/**
 * Critical Security Fixes Dashboard - Phase 1 Implementation
 * Implements immediate security improvements identified in security review
 */
export function CriticalSecurityFixes() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string[]>([]);

  useEffect(() => {
    loadSecurityAlerts();
  }, []);

  const loadSecurityAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('resolved', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Failed to load security alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    setResolving(prev => [...prev, alertId]);
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      
      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    } finally {
      setResolving(prev => prev.filter(id => id !== alertId));
    }
  };

  const resolveBulkAlerts = async (alertType: string) => {
    const typeAlerts = alerts.filter(alert => alert.alert_type === alertType);
    setResolving(prev => [...prev, ...typeAlerts.map(a => a.id)]);
    
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('alert_type', alertType)
        .eq('resolved', false);

      if (error) throw error;
      
      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.alert_type !== alertType));
    } catch (error) {
      console.error('Failed to resolve bulk alerts:', error);
    } finally {
      setResolving(prev => prev.filter(id => !typeAlerts.map(a => a.id).includes(id)));
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-orange-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const groupedAlerts = alerts.reduce((acc, alert) => {
    const type = alert.alert_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(alert);
    return acc;
  }, {} as Record<string, SecurityAlert[]>);

  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const criticalActions = [
    {
      title: 'Enable Leaked Password Protection',
      description: 'CRITICAL: Password breach protection is currently disabled',
      status: 'pending',
      action: 'Manual configuration required in Supabase Dashboard',
      link: 'https://supabase.com/dashboard/project/rdvkwnoeojjvjuknlsjd/auth/providers',
      priority: 'critical'
    },
    {
      title: 'Resolve Security Alerts',
      description: `${mediumAlerts.length} medium-severity alerts require attention`,
      status: mediumAlerts.length === 0 ? 'completed' : 'pending',
      action: 'Review and resolve database access alerts',
      priority: 'high'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Phase 1 Critical Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="w-5 h-5" />
            Phase 1: Critical Security Fixes
          </CardTitle>
          <CardDescription>
            Immediate action required to address critical security vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {criticalActions.map((action, index) => (
            <div key={index} className="border rounded-lg p-4 border-l-4 border-l-destructive">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{action.title}</h4>
                    {action.status === 'completed' ? (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        <CheckCircle className="w-3 h-3 mr-1" />Completed
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />Pending
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {action.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                  <p className="text-xs text-muted-foreground">{action.action}</p>
                </div>
                {action.link && (
                  <Button variant="destructive" size="sm" asChild>
                    <a href={action.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Fix Now
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Alerts Resolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Security Alerts Resolution
          </CardTitle>
          <CardDescription>
            Active security alerts requiring immediate attention ({alerts.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-4">Loading security alerts...</div>
          ) : Object.keys(groupedAlerts).length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ All security alerts have been resolved! Great job maintaining security.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAlerts).map(([type, typeAlerts]) => (
                <div key={type} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium capitalize">
                        {type.replace(/_/g, ' ')}
                      </h4>
                      {getSeverityBadge(typeAlerts[0].severity)}
                      <Badge variant="outline">
                        {typeAlerts.length} alert{typeAlerts.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => resolveBulkAlerts(type)}
                      disabled={resolving.some(id => typeAlerts.map(a => a.id).includes(id))}
                      size="sm"
                      variant="outline"
                    >
                      {resolving.some(id => typeAlerts.map(a => a.id).includes(id)) 
                        ? 'Resolving...' 
                        : `Resolve All (${typeAlerts.length})`
                      }
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {typeAlerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                        <span className="flex-1">{alert.description}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                          <Button
                            onClick={() => resolveAlert(alert.id)}
                            disabled={resolving.includes(alert.id)}
                            size="sm"
                            variant="ghost"
                          >
                            {resolving.includes(alert.id) ? 'Resolving...' : 'Resolve'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {typeAlerts.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{typeAlerts.length - 3} more alerts of this type
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Next Steps After Phase 1:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>✅ Phase 1: Critical security fixes (current focus)</li>
            <li>🔄 Phase 2: Medium priority improvements (granular RLS, MFA)</li>
            <li>📋 Phase 3: Security hardening (headers, automation)</li>
            <li>🔄 Phase 4: Ongoing maintenance (monitoring, audits)</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}