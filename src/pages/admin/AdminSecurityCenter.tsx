import React from 'react';
import { SecurityCenterDashboard } from '@/components/admin/SecurityCenterDashboard';
import { CriticalSecurityFixes } from '@/components/admin/CriticalSecurityFixes';
import { PerformanceImprovementsDashboard } from '@/components/admin/PerformanceImprovementsDashboard';
import { AccessibilityPanel } from '@/components/ui/accessibility-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSecurityCenter() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">📊 Performance</TabsTrigger>
          <TabsTrigger value="critical-fixes">🚨 Critical Fixes</TabsTrigger>
          <TabsTrigger value="security">🛡️ Security Center</TabsTrigger>
          <TabsTrigger value="accessibility">♿ Accessibility</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <PerformanceImprovementsDashboard />
        </TabsContent>
        
        <TabsContent value="critical-fixes" className="space-y-4">
          <CriticalSecurityFixes />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <SecurityCenterDashboard />
        </TabsContent>
        
        <TabsContent value="accessibility" className="space-y-4">
          <div className="max-w-2xl">
            <AccessibilityPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}