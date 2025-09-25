import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Mail, 
  Activity,
  RefreshCw,
  Eye,
  Users
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  alert_type: string;
  severity: string; // Accept any string from database
  description: string;
  metadata: any;
  created_at: string;
  resolved: boolean;
}

interface EmailSecurityMetrics {
  totalFamilies: number;
  familiesWithPrimaryEmail: number;
  activeAliases: number;
  recentResolutions: number;
  securityAlerts: number;
}

export const EmailSecurityMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<EmailSecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSecurityMetrics = async () => {
    try {
      setLoading(true);

      // Get family metrics
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('id, primary_email_designator');

      if (familyError) throw familyError;

      // Get email aliases metrics
      const { data: aliasData, error: aliasError } = await supabase
        .from('email_aliases')
        .select('id, is_active')
        .eq('is_active', true);

      if (aliasError) throw aliasError;

      // Get recent email resolutions (last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: resolutionData, error: resolutionError } = await supabase
        .from('security_alerts')
        .select('id')
        .ilike('alert_type', '%email%')
        .gte('created_at', yesterday.toISOString());

      if (resolutionError) throw resolutionError;

      // Get security alerts for email system
      const { data: alertData, error: alertError } = await supabase
        .from('security_alerts')
        .select('*')
        .ilike('alert_type', '%email%')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (alertError) throw alertError;

      const totalFamilies = familyData?.length || 0;
      const familiesWithPrimaryEmail = familyData?.filter(f => f.primary_email_designator)?.length || 0;

      setMetrics({
        totalFamilies,
        familiesWithPrimaryEmail,
        activeAliases: aliasData?.length || 0,
        recentResolutions: resolutionData?.length || 0,
        securityAlerts: alertData?.length || 0
      });

      setRecentEvents(alertData || []);

    } catch (error) {
      console.error('Failed to fetch security metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch email security metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runSecurityScan = async () => {
    try {
      setLoading(true);

      // Call comprehensive monitoring
      const { data, error } = await supabase.rpc('run_security_monitoring');
      
      if (error) throw error;

      toast({
        title: "Security Scan Complete",
        description: `System status: ${(data as any)?.security_status || 'unknown'}`,
        variant: (data as any)?.security_status === 'secure' ? 'default' : 'destructive',
      });

      // Refresh metrics
      await fetchSecurityMetrics();

    } catch (error) {
      console.error('Security scan failed:', error);
      toast({
        title: "Security Scan Failed",
        description: "Failed to run comprehensive security scan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
    
    // Set up real-time monitoring
    const subscription = supabase
      .channel('email_security_monitoring')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'security_alerts',
        filter: 'alert_type.ilike.%email%'
      }, () => {
        fetchSecurityMetrics();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Eye className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <Shield className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !metrics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading email security metrics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Security Dashboard
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={fetchSecurityMetrics} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={runSecurityScan} 
              size="sm"
              disabled={loading}
            >
              <Shield className="h-4 w-4 mr-2" />
              Security Scan
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {metrics.totalFamilies}
                </div>
                <div className="text-sm text-muted-foreground">Total Families</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {metrics.familiesWithPrimaryEmail}
                </div>
                <div className="text-sm text-muted-foreground">Migrated</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {metrics.activeAliases}
                </div>
                <div className="text-sm text-muted-foreground">Active Aliases</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {metrics.recentResolutions}
                </div>
                <div className="text-sm text-muted-foreground">24h Events</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {metrics.securityAlerts}
                </div>
                <div className="text-sm text-muted-foreground">Open Alerts</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Progress */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Migration Progress
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Primary Email Migration</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.familiesWithPrimaryEmail} / {metrics.totalFamilies} families
                </span>
              </div>
              
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${metrics.totalFamilies > 0 
                      ? (metrics.familiesWithPrimaryEmail / metrics.totalFamilies) * 100 
                      : 0}%` 
                  }}
                />
              </div>
              
              {metrics.totalFamilies > metrics.familiesWithPrimaryEmail && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {metrics.totalFamilies - metrics.familiesWithPrimaryEmail} families 
                    still need to be migrated to the Primary Email Designator System.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Email Security Events
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No recent email security alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="mt-1">
                    {getSeverityIcon(event.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium">{event.alert_type}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          Event Details
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};