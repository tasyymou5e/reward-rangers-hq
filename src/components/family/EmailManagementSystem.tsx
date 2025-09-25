import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Bell, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmailAliasManager } from './EmailAliasManager';
import { NotificationConsolidationManager } from './NotificationConsolidationManager';
import { InternalIdentifierManager } from './InternalIdentifierManager';

interface EmailManagementSystemProps {
  familyId: string;
  familyName: string;
  primaryEmail: string;
  canManage?: boolean;
}

export const EmailManagementSystem: React.FC<EmailManagementSystemProps> = ({
  familyId,
  familyName,
  primaryEmail,
  canManage = false,
}) => {
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFamilyMembers();
  }, [familyId]);

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          user_id,
          profiles(id, username, display_name, email)
        `)
        .eq('family_id', familyId);

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast({
        title: "Error",
        description: "Failed to load family members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading email management system...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Management System
        </CardTitle>
        <CardDescription>
          Complete email management with consolidation, delegation, and internal identifiers for {familyName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="aliases" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="aliases" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Aliases
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="identifiers" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Internal IDs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="aliases" className="mt-6">
            <EmailAliasManager
              familyId={familyId}
              familyName={familyName}
              primaryEmail={primaryEmail}
              canManage={canManage}
            />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <NotificationConsolidationManager
              familyId={familyId}
              primaryEmail={primaryEmail}
              familyMembers={familyMembers}
              canManage={canManage}
            />
          </TabsContent>
          
          <TabsContent value="identifiers" className="mt-6">
            <InternalIdentifierManager
              familyId={familyId}
              familyName={familyName}
              familyMembers={familyMembers}
              canManage={canManage}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};