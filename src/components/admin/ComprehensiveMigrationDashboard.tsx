import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Shield,
  Mail,
  Users,
  Settings,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

interface MigrationStatus {
  familyId: string;
  familyName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  primaryEmail?: string;
  currentStage?: string;
  error?: string;
  progress?: number;
}

interface SystemHealth {
  totalFamilies: number;
  migratedFamilies: number;
  activeMigrations: number;
  failedMigrations: number;
  migrationPercentage: number;
  lastMigrationRun?: string;
}

export const ComprehensiveMigrationDashboard: React.FC = () => {
  const [migrations, setMigrations] = useState<MigrationStatus[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    totalFamilies: 0,
    migratedFamilies: 0,
    activeMigrations: 0,
    failedMigrations: 0,
    migrationPercentage: 0
  });
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemHealth();
    fetchMigrationStatus();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      // Get total families
      const { count: totalFamilies } = await supabase
        .from('families')
        .select('*', { count: 'exact' });

      // Get migrated families
      const { count: migratedFamilies } = await supabase
        .from('families')
        .select('*', { count: 'exact' })
        .not('primary_email_designator', 'is', null);

      // Get failed migrations from security logs
      const { count: failedMigrations } = await supabase
        .from('security_alerts')
        .select('*', { count: 'exact' })
        .eq('alert_type', 'family_migration_failed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const health: SystemHealth = {
        totalFamilies: totalFamilies || 0,
        migratedFamilies: migratedFamilies || 0,
        activeMigrations: 0,
        failedMigrations: failedMigrations || 0,
        migrationPercentage: totalFamilies ? Math.round((migratedFamilies / totalFamilies) * 100) : 0
      };

      setSystemHealth(health);
    } catch (error) {
      console.error('Error fetching system health:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system health metrics",
        variant: "destructive",
      });
    }
  };

  const fetchMigrationStatus = async () => {
    try {
      // Get families that need migration
      const { data: families, error } = await supabase
        .from('families')
        .select(`
          id,
          name,
          primary_email_designator,
          parent_id,
          profiles!families_parent_id_fkey(email)
        `)
        .is('primary_email_designator', null);

      if (error) throw error;

      const migrationList: MigrationStatus[] = families.map(family => ({
        familyId: family.id,
        familyName: family.name,
        status: 'pending' as const,
        primaryEmail: family.profiles?.email,
        progress: 0
      }));

      setMigrations(migrationList);
    } catch (error) {
      console.error('Error fetching migration status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch migration status",
        variant: "destructive",
      });
    }
  };

  const runComprehensiveMigration = async () => {
    if (migrations.length === 0) {
      toast({
        title: "No Migrations",
        description: "All families have already been migrated to the Primary Email System",
      });
      return;
    }

    setIsRunning(true);
    const updatedMigrations = [...migrations];

    for (let i = 0; i < updatedMigrations.length; i++) {
      const migration = updatedMigrations[i];
      migration.status = 'processing';
      migration.currentStage = 'Setting up primary email designator';
      migration.progress = 25;
      setMigrations([...updatedMigrations]);

      try {
        // Stage 1: Update family with primary email designator
        migration.currentStage = 'Updating family record';
        migration.progress = 50;
        setMigrations([...updatedMigrations]);

        const { error: familyError } = await supabase
          .from('families')
          .update({
            primary_email_designator: migration.primaryEmail,
            created_by_primary_email: true
          })
          .eq('id', migration.familyId);

        if (familyError) throw familyError;

        // Stage 2: Setup email routing
        migration.currentStage = 'Setting up email routing';
        migration.progress = 75;
        setMigrations([...updatedMigrations]);

        const { error: routingError } = await supabase.functions.invoke('email-routing-enhanced', {
          body: {
            email: migration.primaryEmail,
            action: 'setup_family',
            data: {
              familyId: migration.familyId,
              primaryEmail: migration.primaryEmail
            }
          }
        });

        if (routingError) {
          console.warn('Email routing setup failed, but migration can continue:', routingError);
        }

        // Stage 3: Finalize migration
        migration.currentStage = 'Finalizing migration';
        migration.progress = 100;
        migration.status = 'completed';
        setMigrations([...updatedMigrations]);
        
        // Log successful migration
        await supabase.rpc('log_security_event_with_rate_limit', {
          event_type: 'comprehensive_family_migration_success',
          user_id_param: null,
          metadata_param: {
            family_id: migration.familyId,
            family_name: migration.familyName,
            primary_email: migration.primaryEmail?.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        migration.status = 'failed';
        migration.error = error instanceof Error ? error.message : 'Unknown error';
        migration.progress = 0;
        
        // Log migration failure
        await supabase.rpc('log_security_event_with_rate_limit', {
          event_type: 'comprehensive_family_migration_failed',
          user_id_param: null,
          metadata_param: {
            family_id: migration.familyId,
            family_name: migration.familyName,
            error: migration.error,
            timestamp: new Date().toISOString()
          }
        });
      }

      setMigrations([...updatedMigrations]);
      setProgress(((i + 1) / updatedMigrations.length) * 100);
    }

    setIsRunning(false);
    await fetchSystemHealth();
    
    const completed = updatedMigrations.filter(m => m.status === 'completed').length;
    const failed = updatedMigrations.filter(m => m.status === 'failed').length;

    toast({
      title: "Migration Complete",
      description: `${completed} families migrated successfully, ${failed} failed`,
      variant: failed > 0 ? "destructive" : "default",
    });
  };

  const testEmailRouting = async () => {
    try {
      const testEmail = 'test@example.com';
      const { data, error } = await supabase.functions.invoke('email-routing-enhanced', {
        body: {
          email: testEmail,
          action: 'resolve'
        }
      });

      if (error) throw error;

      toast({
        title: "Email Routing Test",
        description: data.success ? "Email routing is working correctly" : "Email routing test failed",
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Email routing test failed:', error);
      toast({
        title: "Test Failed",
        description: "Email routing test failed. Check edge function deployment.",
        variant: "destructive",
      });
    }
  };

  const enableLeakedPasswordProtection = async () => {
    toast({
      title: "Security Enhancement",
      description: "Please enable leaked password protection in Supabase Auth settings manually.",
    });
  };

  const getStatusIcon = (status: MigrationStatus['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'processing': return <Upload className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: MigrationStatus['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'outline';
      case 'failed': return 'destructive';
    }
  };

  const getHealthStatusColor = () => {
    if (systemHealth.migrationPercentage >= 90) return 'text-green-500';
    if (systemHealth.migrationPercentage >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Primary Email System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{systemHealth.totalFamilies}</div>
              <div className="text-sm text-muted-foreground">Total Families</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{systemHealth.migratedFamilies}</div>
              <div className="text-sm text-muted-foreground">Migrated</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{migrations.length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{systemHealth.failedMigrations}</div>
              <div className="text-sm text-muted-foreground">Failed (7d)</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Migration Progress</span>
              <span className={`text-sm font-bold ${getHealthStatusColor()}`}>
                {systemHealth.migrationPercentage}%
              </span>
            </div>
            <Progress value={systemHealth.migrationPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Completed Components
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Database className="h-3 w-3" /> Database Schema & Functions
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Email Routing Edge Function
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-3 w-3" /> Family Management Components
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3" /> Security & Audit Logging
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-orange-600">
                    <Clock className="h-4 w-4" />
                    Pending Tasks
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Resend.com Integration
                    </li>
                    <li className="flex items-center gap-2">
                      <Settings className="h-3 w-3" /> Production Configuration
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3" /> Leaked Password Protection
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Family Migration Tool
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Migrate existing families to use the Primary Email Designator System
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Button 
                  onClick={fetchMigrationStatus}
                  disabled={isRunning}
                  variant="outline"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Scan for Migrations
                </Button>
                
                <Button 
                  onClick={runComprehensiveMigration}
                  disabled={isRunning || migrations.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Run Migration
                </Button>
              </div>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Migration Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {migrations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Migration Status</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {migrations.map((migration) => (
                      <div
                        key={migration.familyId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(migration.status)}
                          <div>
                            <div className="font-medium">{migration.familyName}</div>
                            <div className="text-sm text-muted-foreground">
                              {migration.primaryEmail?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                            </div>
                            {migration.currentStage && (
                              <div className="text-xs text-blue-600">
                                {migration.currentStage}
                              </div>
                            )}
                            {migration.error && (
                              <div className="text-sm text-red-500">
                                Error: {migration.error}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(migration.status)}>
                            {migration.status.charAt(0).toUpperCase() + migration.status.slice(1)}
                          </Badge>
                          {migration.progress !== undefined && migration.status === 'processing' && (
                            <div className="text-xs text-muted-foreground">
                              {migration.progress}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Testing & Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={testEmailRouting} variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Test Email Routing
                </Button>
                
                <Button onClick={fetchSystemHealth} variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Refresh Health Metrics
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Production Checklist:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Configure Resend.com API key in edge function secrets</li>
                    <li>• Enable leaked password protection in Supabase Auth</li>
                    <li>• Test email routing with real email addresses</li>
                    <li>• Verify all RLS policies are working correctly</li>
                    <li>• Run comprehensive migration for existing families</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Authentication Security</h4>
                  <Button onClick={enableLeakedPasswordProtection} variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Enable Leaked Password Protection
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to Supabase → Authentication → Password Protection
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Email Service Configuration</h4>
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Configure RESEND_API_KEY in Supabase Edge Functions secrets for email functionality.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};