import React from 'react';
import { SecurityCenterDashboard } from '@/components/admin/SecurityCenterDashboard';
import { AccessibilityPanel } from '@/components/ui/accessibility-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSecurityCenter() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="security">Security Center</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>
        
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