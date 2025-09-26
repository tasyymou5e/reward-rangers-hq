import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Plus, 
  Trash2, 
  Shield, 
  Users, 
  Crown, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface EmailAlias {
  id: string;
  alias_email: string;
  primary_email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  user_id?: string;
  display_name?: string;
}

interface FamilyMember {
  id: string;
  display_name: string;
  email?: string;
  role: string;
}

interface EnhancedEmailManagementProps {
  familyId: string;
  familyName: string;
  primaryEmail: string;
  canManage?: boolean;
}

export const EnhancedEmailManagement: React.FC<EnhancedEmailManagementProps> = ({
  familyId,
  familyName,
  primaryEmail,
  canManage = false
}) => {
  const [aliases, setAliases] = useState<EmailAlias[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('child');
  const { toast } = useToast();

  useEffect(() => {
    fetchAliases();
    fetchFamilyMembers();
  }, [familyId]);

  const fetchAliases = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('email-routing-enhanced', {
        body: {
          email: primaryEmail,
          action: 'get_aliases'
        }
      });

      if (error) throw error;

      if (data.success) {
        setAliases(data.aliases || []);
      } else {
        throw new Error(data.message || 'Failed to fetch aliases');
      }
    } catch (error) {
      console.error('Error fetching aliases:', error);
      toast({
        title: "Error",
        description: "Failed to load email aliases",
        variant: "destructive",
      });
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const { data: members, error } = await supabase
        .from('family_members')
        .select(`
          user_id,
          profiles!inner(
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('family_id', familyId);

      if (error) throw error;

      const membersList = members?.map(member => ({
        id: member.profiles.id,
        display_name: member.profiles.display_name,
        email: member.profiles.email,
        role: member.profiles.role
      })) || [];

      setFamilyMembers(membersList);
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

  const createEmailAlias = async () => {
    if (!newMemberName.trim() || !canManage) return;

    setCreating(true);
    try {
      // First check if we need to create a user account
      const { data, error } = await supabase.functions.invoke('email-routing-enhanced', {
        body: {
          email: primaryEmail,
          action: 'create_alias',
          data: {
            familyId,
            targetUserId: null, // Will be created by the function
            displayName: newMemberName.trim(),
            memberType: newMemberRole
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Email Alias Created",
          description: `Created alias: ${data.alias_email}`,
        });
        
        setNewMemberName('');
        setNewMemberRole('child');
        await fetchAliases();
        await fetchFamilyMembers();
      } else {
        throw new Error(data.error || 'Failed to create alias');
      }
    } catch (error) {
      console.error('Error creating alias:', error);
      toast({
        title: "Error",
        description: "Failed to create email alias",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const sendTestEmail = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('email-routing-enhanced', {
        body: {
          email: primaryEmail,
          action: 'send_notification',
          data: {
            to: email,
            subject: 'ChoreQuest Family Email Test',
            message: `
              <h2>Hello from ChoreQuest Family!</h2>
              <p>This is a test email to verify that your family email alias is working correctly.</p>
              <p><strong>Family:</strong> ${familyName}</p>
              <p><strong>Email Alias:</strong> ${email}</p>
              <p>If you received this email, your alias is working perfectly!</p>
            `,
            notificationType: 'test'
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Test Email Sent",
          description: `Test email sent to ${email}`,
        });
      } else {
        throw new Error(data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'parent': return <Users className="h-4 w-4" />;
      case 'child': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'parent': return 'default';
      case 'child': return 'secondary';
      case 'admin': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Loading email management...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Email Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Primary Family Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">{primaryEmail}</div>
                <div className="text-sm text-muted-foreground">
                  Primary designator for {familyName}
                </div>
              </div>
            </div>
            <Badge variant="default">Primary</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Email Aliases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Email Aliases
            </span>
            {canManage && (
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aliases.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No email aliases created yet. Create aliases for family members to use the system.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {aliases.map((alias) => (
                <div
                  key={alias.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(alias.role)}
                    <div>
                      <div className="font-medium">{alias.alias_email}</div>
                      <div className="text-sm text-muted-foreground">
                        {alias.display_name || 'Family Member'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(alias.role)}>
                      {alias.role}
                    </Badge>
                    {alias.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sendTestEmail(alias.alias_email)}
                      >
                        Test
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Alias */}
          {canManage && (
            <div className="pt-4 border-t">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Email Alias
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="memberName">Member Name</Label>
                    <Input
                      id="memberName"
                      placeholder="Child's name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="memberRole">Role</Label>
                    <select
                      id="memberRole"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="child">Child</option>
                      <option value="teen">Teen</option>
                      <option value="extended">Extended Family</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      onClick={createEmailAlias}
                      disabled={creating || !newMemberName.trim()}
                      className="w-full"
                    >
                      {creating ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Alias
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Members ({familyMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {familyMembers.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No family members found. Add members to your family to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(member.role)}
                    <div>
                      <div className="font-medium">{member.display_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};