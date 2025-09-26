import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, Shield, ArrowRight } from 'lucide-react';
import { PrimaryEmailFamilySetup } from '@/components/family/PrimaryEmailFamilySetup';
import { EmailAliasManager } from '@/components/family/EmailAliasManager';
import { EnhancedEmailManagement } from '@/components/family/EnhancedEmailManagement';
import { useAuth } from '@/contexts/AuthContext';

export const PrimaryEmailAuth: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  if (user) {
    // User is authenticated, show family management
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2">Family Email Management</h1>
            <p className="text-muted-foreground text-center">
              Manage your family's primary email designator system
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="aliases">Email Aliases</TabsTrigger>
              <TabsTrigger value="settings">Family Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="aliases" className="mt-6">
              <EnhancedEmailManagement 
                familyId="current-family-id" // TODO: Get from context
                familyName="Sample Family" // TODO: Get from context
                primaryEmail="family@example.com" // TODO: Get from context
                canManage={true}
              />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Family Settings</CardTitle>
                  <CardDescription>
                    Configure your family's primary email system settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Family settings management coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to ChoreNinja
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Family Management with Primary Email Designator System
          </p>
          <Badge variant="secondary" className="mb-8">
            Enhanced Security & Simplified Management
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="create">Create Family</TabsTrigger>
            <TabsTrigger value="join">Join Family</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Primary Email System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    One primary email manages your entire family. All members get unique aliases under your domain.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">Primary</Badge>
                      <span>parent@family.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">Child</Badge>
                      <span>child1@family.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">Child</Badge>
                      <span>child2@family.com</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Enhanced Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Centralized control with role-based permissions and comprehensive audit trails.
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Single point of email management</li>
                    <li>• Role-based access control</li>
                    <li>• Activity monitoring</li>
                    <li>• Simplified password recovery</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Family Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comprehensive tools for managing chores, rewards, and family activities.
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Chore assignment & tracking</li>
                    <li>• Points & rewards system</li>
                    <li>• Progress analytics</li>
                    <li>• Family achievements</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-4">Ready to get started?</h3>
              <div className="flex justify-center gap-4">
                <Button 
                  size="lg" 
                  onClick={() => setActiveTab('create')}
                  className="flex items-center gap-2"
                >
                  Create New Family
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setActiveTab('join')}
                >
                  Join Existing Family
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create">
            <PrimaryEmailFamilySetup />
          </TabsContent>

          <TabsContent value="join">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Join a Family</CardTitle>
                <CardDescription>
                  Enter your family's invitation code or alias email to join
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Family joining functionality coming soon...
                </p>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Contact your family administrator for an invitation
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};