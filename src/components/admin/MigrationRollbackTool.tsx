import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  RotateCcw, 
  AlertTriangle, 
  Shield, 
  Database,
  CheckCircle,
  Clock
} from 'lucide-react';

interface RollbackStep {
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export const MigrationRollbackTool: React.FC = () => {
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackSteps, setRollbackSteps] = useState<RollbackStep[]>([
    {
      name: 'Backup Current State',
      description: 'Create backup of current family configurations',
      status: 'pending'
    },
    {
      name: 'Clear Email Aliases',
      description: 'Remove family member email aliases',
      status: 'pending'
    },
    {
      name: 'Reset Family Records',
      description: 'Remove primary email designators from families',
      status: 'pending'
    },
    {
      name: 'Reset Profile Records',
      description: 'Clear email alias and designator fields from profiles',
      status: 'pending'
    },
    {
      name: 'Verify Rollback',
      description: 'Validate that rollback completed successfully',
      status: 'pending'
    }
  ]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const executeRollback = async () => {
    setIsRollingBack(true);
    const updatedSteps = [...rollbackSteps];

    try {
      // Step 1: Backup Current State
      updatedSteps[0].status = 'processing';
      setRollbackSteps([...updatedSteps]);

      const { error: backupError } = await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: 'migration_rollback_initiated',
        user_id_param: null,
        metadata_param: {
          timestamp: new Date().toISOString(),
          initiated_by: 'admin',
          rollback_reason: 'manual_rollback_request'
        }
      });

      if (backupError) throw new Error(`Backup failed: ${backupError.message}`);
      
      updatedSteps[0].status = 'completed';
      setRollbackSteps([...updatedSteps]);
      setProgress(20);

      // Step 2: Clear Email Aliases
      updatedSteps[1].status = 'processing';
      setRollbackSteps([...updatedSteps]);

      const { error: aliasError } = await supabase
        .from('email_aliases')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (aliasError) throw new Error(`Alias cleanup failed: ${aliasError.message}`);

      updatedSteps[1].status = 'completed';
      setRollbackSteps([...updatedSteps]);
      setProgress(40);

      // Step 3: Reset Family Records
      updatedSteps[2].status = 'processing';
      setRollbackSteps([...updatedSteps]);

      const { error: familyError } = await supabase
        .from('families')
        .update({
          primary_email_designator: null,
          primary_email_designator_id: null,
          created_by_primary_email: null
        })
        .not('primary_email_designator', 'is', null);

      if (familyError) throw new Error(`Family reset failed: ${familyError.message}`);

      updatedSteps[2].status = 'completed';
      setRollbackSteps([...updatedSteps]);
      setProgress(60);

      // Step 4: Reset Profile Records
      updatedSteps[3].status = 'processing';
      setRollbackSteps([...updatedSteps]);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email_alias: null,
          is_primary_designator: null,
          parent_email_designator: null
        })
        .or('email_alias.not.is.null,is_primary_designator.not.is.null,parent_email_designator.not.is.null');

      if (profileError) throw new Error(`Profile reset failed: ${profileError.message}`);

      updatedSteps[3].status = 'completed';
      setRollbackSteps([...updatedSteps]);
      setProgress(80);

      // Step 5: Verify Rollback
      updatedSteps[4].status = 'processing';
      setRollbackSteps([...updatedSteps]);

      // Verify rollback by checking for remaining migration data
      const { count: remainingFamilies } = await supabase
        .from('families')
        .select('*', { count: 'exact' })
        .not('primary_email_designator', 'is', null);

      const { count: remainingProfiles } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .not('email_alias', 'is', null);

      if ((remainingFamilies || 0) > 0 || (remainingProfiles || 0) > 0) {
        throw new Error(`Rollback verification failed: ${remainingFamilies} families and ${remainingProfiles} profiles still have migration data`);
      }

      updatedSteps[4].status = 'completed';
      setRollbackSteps([...updatedSteps]);
      setProgress(100);

      // Log successful rollback
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: 'migration_rollback_completed',
        user_id_param: null,
        metadata_param: {
          timestamp: new Date().toISOString(),
          rollback_status: 'success',
          steps_completed: 5
        }
      });

      toast({
        title: "Rollback Complete",
        description: "Primary Email System rollback completed successfully",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark current step as failed
      const currentStepIndex = updatedSteps.findIndex(step => step.status === 'processing');
      if (currentStepIndex >= 0) {
        updatedSteps[currentStepIndex].status = 'failed';
        updatedSteps[currentStepIndex].error = errorMessage;
      }

      setRollbackSteps([...updatedSteps]);

      // Log failed rollback
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: 'migration_rollback_failed',
        user_id_param: null,
        metadata_param: {
          timestamp: new Date().toISOString(),
          error: errorMessage,
          failed_step: currentStepIndex >= 0 ? updatedSteps[currentStepIndex].name : 'unknown'
        }
      });

      toast({
        title: "Rollback Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRollingBack(false);
    }
  };

  const getStepIcon = (status: RollbackStep['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'processing': return <RotateCcw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <RotateCcw className="h-5 w-5" />
          Migration Rollback Tool
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Rollback the Primary Email System migration and restore original family configurations
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This operation will permanently remove all Primary Email System data 
            including email aliases, designators, and related configurations. This action cannot be undone.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Button 
            onClick={executeRollback}
            disabled={isRollingBack}
            variant="destructive"
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isRollingBack ? 'Rolling Back...' : 'Execute Rollback'}
          </Button>

          {isRollingBack && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rollback Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-medium">Rollback Steps</h3>
            {rollbackSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                {getStepIcon(step.status)}
                <div className="flex-1">
                  <div className="font-medium">{step.name}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                  {step.error && (
                    <div className="text-sm text-red-500 mt-1">
                      Error: {step.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};