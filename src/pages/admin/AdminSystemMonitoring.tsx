import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  Server,
  Database,
  Zap
} from "lucide-react";

interface SystemMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  recorded_at: string;
  status: 'normal' | 'warning' | 'critical';
}

interface SystemAlert {
  id: string;
  alert_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export default function AdminSystemMonitoring() {
  const { profile } = useAdminAuth();
  const { alerts, resolveAlert, getUnresolvedAlertsCount } = useSecurityMonitoring();
  const { toast } = useToast();

  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemData();
    
    // Set up real-time monitoring
    const interval = setInterval(loadSystemData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      // Mock system metrics data
      const metrics = [
        { id: '1', metric_name: 'cpu_usage', metric_value: 45, metric_unit: '%', recorded_at: new Date().toISOString(), status: 'normal' as const },
        { id: '2', metric_name: 'memory_usage', metric_value: 67, metric_unit: '%', recorded_at: new Date().toISOString(), status: 'normal' as const }
      ];

      // Mock system alerts
      const alerts = [];

      setSystemMetrics(metrics || []);
      setSystemAlerts(alerts || []);
    } catch (error) {
      console.error('Error loading system data:', error);
      toast({
        title: "Error",
        description: "Failed to load system monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          resolved: true,
          resolved_by: profile?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      await loadSystemData();
      toast({
        title: "Alert resolved",
        description: "System alert has been marked as resolved",
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  const getMetricStatus = (metrics: SystemMetric[], metricName: string) => {
    const metric = metrics.find(m => m.metric_name === metricName);
    if (!metric) return { value: 'N/A', status: 'normal', unit: '' };
    
    return {
      value: metric.metric_value,
      status: metric.status,
      unit: metric.metric_unit
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Get current system status
  const unresolvedAlerts = systemAlerts.filter(alert => !alert.resolved_at);
  const criticalAlerts = unresolvedAlerts.filter(alert => alert.severity === 'critical');
  const systemStatus = criticalAlerts.length > 0 ? 'critical' : 
                      unresolvedAlerts.length > 0 ? 'warning' : 'normal';

  const cpuUsage = getMetricStatus(systemMetrics, 'cpu_usage');
  const memoryUsage = getMetricStatus(systemMetrics, 'memory_usage');
  const dbConnections = getMetricStatus(systemMetrics, 'db_connections');
  const responseTime = getMetricStatus(systemMetrics, 'avg_response_time');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-lg">Loading system monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-primary flex items-center gap-2">
            <Activity className="h-6 w-6" />
            System Monitoring
          </h1>
          <p className="text-admin-primary/70 mt-1">
            Real-time system health and performance monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant={systemStatus === 'normal' ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            {systemStatus === 'normal' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            System {systemStatus}
          </Badge>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">CPU Usage</p>
                <p className={`text-2xl font-bold ${getStatusColor(cpuUsage.status)}`}>
                  {cpuUsage.value}{cpuUsage.unit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Memory Usage</p>
                <p className={`text-2xl font-bold ${getStatusColor(memoryUsage.status)}`}>
                  {memoryUsage.value}{memoryUsage.unit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">DB Connections</p>
                <p className={`text-2xl font-bold ${getStatusColor(dbConnections.status)}`}>
                  {dbConnections.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className={`text-2xl font-bold ${getStatusColor(responseTime.status)}`}>
                  {responseTime.value}{responseTime.unit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({unresolvedAlerts.length})
            </span>
            {unresolvedAlerts.length > 0 && (
              <Badge variant="destructive">
                {criticalAlerts.length} Critical
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unresolvedAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">All Clear!</h3>
              <p className="text-gray-600">No active system alerts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unresolvedAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.alert_type}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemMetrics.slice(0, 10).map((metric) => (
              <div key={metric.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{metric.metric_name}</Badge>
                  <span className="font-medium">
                    {metric.metric_value} {metric.metric_unit}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={metric.status === 'normal' ? 'default' : 'destructive'}>
                    {metric.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(metric.recorded_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Monitoring Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-4">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">No security alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{alert.alert_type}</p>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}