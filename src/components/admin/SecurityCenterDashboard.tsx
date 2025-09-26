import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SecurityDashboard } from '@/components/SecurityDashboard';
import { SecurityConfigurationPanel } from './SecurityConfigurationPanel';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  Database, 
  Lock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export function SecurityCenterDashboard() {
  const { 
    alerts, 
    loading, 
    getCriticalAlertsCount, 
    getUnresolvedAlertsCount,
    runComprehensiveMonitoring,
    monitoringResult
  } = useSecurityMonitoring();

  const [securityMetrics, setSecurityMetrics] = useState({
    totalUsers: 0,
    activeSessionsToday: 0,
    failedLoginAttempts: 0,
    databaseQueries: 0,
    systemHealth: 'healthy' as 'healthy' | 'warning' | 'critical'
  });

  useEffect(() => {
    // Simulate fetching security metrics
    setSecurityMetrics({
      totalUsers: 1247,
      activeSessionsToday: 89,
      failedLoginAttempts: 12,
      databaseQueries: 3847,
      systemHealth: getCriticalAlertsCount() > 0 ? 'critical' : 
                   getUnresolvedAlertsCount() > 5 ? 'warning' : 'healthy'
    });
  }, [alerts, getCriticalAlertsCount, getUnresolvedAlertsCount]);

  const criticalCount = getCriticalAlertsCount();
  const unresolvedCount = getUnresolvedAlertsCount();

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const handleRunSecurityScan = async () => {
    await runComprehensiveMonitoring();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading security dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor and manage system security in real-time
          </p>
        </div>
        <Button onClick={handleRunSecurityScan} variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          Run Security Scan
        </Button>
      </div>

      {/* Critical Alerts Banner */}
      {criticalCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalCount} critical security alert{criticalCount !== 1 ? 's' : ''} require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getHealthBadgeVariant(securityMetrics.systemHealth)}>
              {securityMetrics.systemHealth.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {securityMetrics.activeSessionsToday} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedCount}</div>
            <p className="text-xs text-muted-foreground">
              {criticalCount} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.failedLoginAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Activity</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.databaseQueries}</div>
            <p className="text-xs text-muted-foreground">
              Queries today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Security Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <SecurityConfigurationPanel />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Security Monitoring</CardTitle>
              <CardDescription>
                Live view of security events and system activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monitoringResult ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Active Threats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {monitoringResult.threats?.length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Security Events</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {monitoringResult.events?.length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Risk Level</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant={monitoringResult.riskLevel === 'high' ? 'destructive' : 'default'}>
                          {monitoringResult.riskLevel || 'Low'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Run a security scan to see monitoring results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Reports</CardTitle>
              <CardDescription>
                Generate and download comprehensive security reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Monthly Security Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Shield className="h-6 w-6 mb-2" />
                  Compliance Audit Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  Incident Response Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Database className="h-6 w-6 mb-2" />
                  Database Security Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}