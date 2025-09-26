import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckSquare, 
  AlertTriangle, 
  Info, 
  Shield,
  Database,
  Mail,
  Users
} from 'lucide-react';

interface ValidationResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: string;
}

interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  readinessScore: number;
}

export const MigrationValidationTool: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runValidation = async () => {
    setIsValidating(true);
    setProgress(0);
    const validationResults: ValidationResult[] = [];

    try {
      // Database Schema Validation
      setProgress(10);
      
      // Check families table structure
      const { data: familiesSchema } = await supabase
        .from('families')
        .select('primary_email_designator, primary_email_designator_id, family_email_domain')
        .limit(1);

      validationResults.push({
        category: 'Database Schema',
        test: 'Families Table Structure',
        status: familiesSchema ? 'pass' : 'fail',
        message: familiesSchema ? 'Primary email fields present' : 'Missing primary email fields',
        details: 'Required fields: primary_email_designator, primary_email_designator_id, family_email_domain'
      });

      setProgress(20);

      // Check profiles table structure
      const { data: profilesSchema } = await supabase
        .from('profiles')
        .select('email_alias, is_primary_designator, parent_email_designator')
        .limit(1);

      validationResults.push({
        category: 'Database Schema',
        test: 'Profiles Table Structure',
        status: profilesSchema ? 'pass' : 'fail',
        message: profilesSchema ? 'Email alias fields present' : 'Missing email alias fields',
        details: 'Required fields: email_alias, is_primary_designator, parent_email_designator'
      });

      setProgress(30);

      // Check email aliases table
      const { count: emailAliasesCount, error: aliasError } = await supabase
        .from('email_aliases')
        .select('*', { count: 'exact' })
        .limit(1);

      validationResults.push({
        category: 'Database Schema',
        test: 'Email Aliases Table',
        status: !aliasError ? 'pass' : 'fail',
        message: !aliasError ? 'Email aliases table accessible' : 'Email aliases table missing or inaccessible',
        details: aliasError?.message
      });

      setProgress(40);

      // Migration Readiness Validation
      const { count: totalFamilies } = await supabase
        .from('families')
        .select('*', { count: 'exact' });

      const { count: migratedFamilies } = await supabase
        .from('families')
        .select('*', { count: 'exact' })
        .not('primary_email_designator', 'is', null);

      const { count: familiesWithParents } = await supabase
        .from('families')
        .select('*', { count: 'exact' })
        .not('parent_id', 'is', null);

      validationResults.push({
        category: 'Migration Readiness',
        test: 'Family Records Integrity',
        status: familiesWithParents === totalFamilies ? 'pass' : 'warning',
        message: `${familiesWithParents}/${totalFamilies} families have valid parent assignments`,
        details: familiesWithParents !== totalFamilies ? 'Some families may be missing parent assignments' : undefined
      });

      setProgress(50);

      // Check for families without parent emails
      const { count: familiesWithoutParentEmail } = await supabase
        .from('families')
        .select(`
          *,
          profiles!families_parent_id_fkey(email)
        `, { count: 'exact' })
        .is('profiles.email', null);

      validationResults.push({
        category: 'Migration Readiness',
        test: 'Parent Email Availability',
        status: (familiesWithoutParentEmail || 0) === 0 ? 'pass' : 'fail',
        message: `${(familiesWithoutParentEmail || 0)} families missing parent email addresses`,
        details: (familiesWithoutParentEmail || 0) > 0 ? 'These families cannot be migrated without parent email addresses' : undefined
      });

      setProgress(60);

      // Edge Functions Validation
      try {
        const { data: functionTest, error: functionError } = await supabase.functions.invoke('email-routing-enhanced', {
          body: { action: 'health_check' }
        });

        validationResults.push({
          category: 'Edge Functions',
          test: 'Email Routing Function',
          status: !functionError ? 'pass' : 'fail',
          message: !functionError ? 'Email routing function is responsive' : 'Email routing function is not responding',
          details: functionError?.message
        });
      } catch (error) {
        validationResults.push({
          category: 'Edge Functions',
          test: 'Email Routing Function',
          status: 'fail',
          message: 'Email routing function deployment issue',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      setProgress(70);

      // Security Validation
      const { count: securityEvents } = await supabase
        .from('security_alerts')
        .select('*', { count: 'exact' })
        .eq('alert_type', 'migration_security_check')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      validationResults.push({
        category: 'Security',
        test: 'Recent Security Events',
        status: (securityEvents || 0) === 0 ? 'pass' : 'warning',
        message: `${securityEvents || 0} migration-related security events in last 24h`,
        details: (securityEvents || 0) > 0 ? 'Review security events before proceeding with migration' : undefined
      });

      setProgress(80);

      // System Configuration Validation
      const migrationPercentage = totalFamilies ? Math.round(((migratedFamilies || 0) / totalFamilies) * 100) : 0;

      validationResults.push({
        category: 'System Status',
        test: 'Migration Progress',
        status: migrationPercentage < 100 ? 'info' : 'pass',
        message: `${migrationPercentage}% of families are migrated`,
        details: migrationPercentage < 100 ? `${totalFamilies - (migratedFamilies || 0)} families pending migration` : 'All families migrated'
      });

      setProgress(90);

      // External Services Validation
      validationResults.push({
        category: 'External Services',
        test: 'Email Service Configuration',
        status: 'warning',
        message: 'Email service validation requires manual setup',
        details: 'Resend.com configuration must be validated manually for production use'
      });

      validationResults.push({
        category: 'Security',
        test: 'Leaked Password Protection',
        status: 'warning',
        message: 'Manual security configuration required',
        details: 'Leaked password protection must be enabled in Supabase Auth settings'
      });

      setProgress(100);

      // Calculate summary
      const passed = validationResults.filter(r => r.status === 'pass').length;
      const failed = validationResults.filter(r => r.status === 'fail').length;
      const warnings = validationResults.filter(r => r.status === 'warning').length;
      const total = validationResults.length;
      const readinessScore = Math.round(((passed + (warnings * 0.5)) / total) * 100);

      const validationSummary: ValidationSummary = {
        total,
        passed,
        failed,
        warnings,
        readinessScore
      };

      setResults(validationResults);
      setSummary(validationSummary);

      // Log validation results
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: 'migration_validation_completed',
        user_id_param: null,
        metadata_param: {
          timestamp: new Date().toISOString(),
          readiness_score: readinessScore,
          total_tests: total,
          passed_tests: passed,
          failed_tests: failed,
          warnings: warnings
        }
      });

      toast({
        title: "Validation Complete",
        description: `Readiness Score: ${readinessScore}% (${passed}/${total} tests passed)`,
        variant: failed > 0 ? "destructive" : "default",
      });

    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: "Failed to run migration validation",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass': return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'fail': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: ValidationResult['status']) => {
    const variants = {
      pass: 'outline' as const,
      fail: 'destructive' as const,
      warning: 'secondary' as const,
      info: 'default' as const
    };
    return variants[status];
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'database schema': return <Database className="h-4 w-4" />;
      case 'edge functions': return <Shield className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'external services': return <Mail className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Migration Validation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comprehensive validation of migration readiness and system integrity
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button 
            onClick={runValidation}
            disabled={isValidating}
            className="flex-1"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            {isValidating ? 'Validating...' : 'Run Validation'}
          </Button>
        </div>

        {isValidating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Validation Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Validation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{summary.passed}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{summary.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{summary.warnings}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${summary.readinessScore >= 80 ? 'text-green-500' : summary.readinessScore >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                    {summary.readinessScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Readiness</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Migration Readiness</span>
                  <span className={`text-sm font-bold ${summary.readinessScore >= 80 ? 'text-green-500' : summary.readinessScore >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                    {summary.readinessScore}%
                  </span>
                </div>
                <Progress value={summary.readinessScore} />
              </div>

              {summary.readinessScore < 80 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {summary.failed > 0 
                      ? 'Critical issues detected. Address failed tests before proceeding with migration.'
                      : 'Some warnings detected. Review and address warnings for optimal migration.'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Validation Results</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(result.category)}
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{result.test}</div>
                      <Badge variant={getStatusBadge(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">{result.category}</div>
                    <div className="text-sm">{result.message}</div>
                    {result.details && (
                      <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                        {result.details}
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
  );
};