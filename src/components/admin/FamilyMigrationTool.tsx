import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface MigrationStatus {
  familyId: string;
  familyName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  primaryEmail?: string;
  error?: string;
}

export const FamilyMigrationTool: React.FC = () => {
  const [migrations, setMigrations] = useState<MigrationStatus[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const scanFamiliesForMigration = async () => {
    try {
      setIsRunning(true);
      setProgress(10);

      // Get families without primary email designators
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

      setProgress(30);

      const migrationList: MigrationStatus[] = families.map(family => ({
        familyId: family.id,
        familyName: family.name,
        status: 'pending' as const,
        primaryEmail: family.profiles?.email
      }));

      setMigrations(migrationList);
      setProgress(100);

      toast({
        title: "Scan Complete",
        description: `Found ${migrationList.length} families that need primary email migration`,
      });

    } catch (error) {
      console.error('Migration scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to scan families for migration",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runMigration = async () => {
    if (migrations.length === 0) {
      toast({
        title: "No Migrations",
        description: "No families found that need migration. Run scan first.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    const updatedMigrations = [...migrations];

    for (let i = 0; i < updatedMigrations.length; i++) {
      const migration = updatedMigrations[i];
      migration.status = 'processing';
      setMigrations([...updatedMigrations]);

      try {
        // Update family with primary email designator
        const { error } = await supabase
          .from('families')
          .update({
            primary_email_designator: migration.primaryEmail,
            created_by_primary_email: true
          })
          .eq('id', migration.familyId);

        if (error) throw error;

        migration.status = 'completed';
        
        // Log migration success
        await supabase.rpc('log_security_event', {
          event_type: 'family_migrated_to_primary_email',
          user_id: null,
          metadata: {
            family_id: migration.familyId,
            family_name: migration.familyName,
            primary_email: migration.primaryEmail,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        migration.status = 'failed';
        migration.error = error instanceof Error ? error.message : 'Unknown error';
        
        // Log migration failure
        await supabase.rpc('log_security_event', {
          event_type: 'family_migration_failed',
          user_id: null,
          metadata: {
            family_id: migration.familyId,
            error: migration.error,
            timestamp: new Date().toISOString()
          }
        });
      }

      setMigrations([...updatedMigrations]);
      setProgress(((i + 1) / updatedMigrations.length) * 100);
    }

    setIsRunning(false);
    
    const completed = updatedMigrations.filter(m => m.status === 'completed').length;
    const failed = updatedMigrations.filter(m => m.status === 'failed').length;

    toast({
      title: "Migration Complete",
      description: `${completed} families migrated successfully, ${failed} failed`,
      variant: failed > 0 ? "destructive" : "default",
    });
  };

  const getStatusIcon = (status: MigrationStatus['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Upload className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: MigrationStatus['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Family Primary Email Migration Tool
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Migrate existing families to use the Primary Email Designator System
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex gap-4">
          <Button 
            onClick={scanFamiliesForMigration}
            disabled={isRunning}
            variant="outline"
          >
            <Database className="h-4 w-4 mr-2" />
            Scan for Migrations
          </Button>
          
          <Button 
            onClick={runMigration}
            disabled={isRunning || migrations.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Run Migration
          </Button>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Migration Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Migration List */}
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
                        {migration.primaryEmail}
                      </div>
                      {migration.error && (
                        <div className="text-sm text-red-500">
                          Error: {migration.error}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant={getStatusColor(migration.status)}>
                    {migration.status.charAt(0).toUpperCase() + migration.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {migrations.length > 0 && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {migrations.filter(m => m.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  {migrations.filter(m => m.status === 'processing').length}
                </div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {migrations.filter(m => m.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {migrations.filter(m => m.status === 'failed').length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};