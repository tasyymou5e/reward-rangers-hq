import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Rocket,
  Database,
  Shield,
  RotateCcw,
  CheckSquare,
  ArrowRight
} from 'lucide-react';

export const Phase3StatusCard: React.FC = () => {
  const navigate = useNavigate();

  const phaseProgress = {
    overall: 100,
    components: [
      { name: 'Migration Dashboard', progress: 100 },
      { name: 'Validation Tools', progress: 100 },
      { name: 'Rollback System', progress: 100 },
      { name: 'Database Functions', progress: 100 },
      { name: 'Security Integration', progress: 100 },
      { name: 'Error Recovery', progress: 100 }
    ]
  };

  const capabilities = [
    {
      icon: <Database className="h-4 w-4" />,
      name: 'Family Migration',
      description: 'Comprehensive family data transformation'
    },
    {
      icon: <CheckSquare className="h-4 w-4" />,
      name: 'Pre-Migration Validation',
      description: 'System readiness and integrity checks'
    },
    {
      icon: <RotateCcw className="h-4 w-4" />,
      name: 'Safe Rollback',
      description: 'Emergency recovery procedures'
    },
    {
      icon: <Shield className="h-4 w-4" />,
      name: 'Security Monitoring',
      description: 'Comprehensive audit and logging'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-green-500" />
            Phase 3: Migration Strategy
          </div>
          <Badge variant="outline" className="text-green-600 border-green-200">
            COMPLETED
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Primary Email System migration infrastructure is fully operational
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Implementation Progress</span>
            <span className="text-sm font-bold text-green-600">{phaseProgress.overall}%</span>
          </div>
          <Progress value={phaseProgress.overall} className="h-3" />
        </div>

        {/* Completion Status */}
        <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="font-semibold text-green-700">Migration System Ready</div>
            <div className="text-sm text-green-600">All core components operational</div>
          </div>
        </div>

        {/* Key Capabilities */}
        <div className="space-y-3">
          <h4 className="font-medium">Migration Capabilities</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {capabilities.map((capability, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="text-green-500 mt-0.5">
                  {capability.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{capability.name}</div>
                  <div className="text-xs text-muted-foreground">{capability.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={() => navigate('/admin/system-monitoring')}
            className="w-full"
            variant="default"
          >
            <Database className="h-4 w-4 mr-2" />
            Open Migration Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <div className="text-xs text-center text-muted-foreground">
            Ready for staging deployment • Production requires email service setup
          </div>
        </div>
      </CardContent>
    </Card>
  );
};