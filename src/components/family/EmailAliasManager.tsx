import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Mail, Plus, Edit, Trash2, Users, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailAlias {
  id: string;
  alias_email: string;
  primary_email: string;
  role: string;
  is_active: boolean;
  user_id: string;
  family_id: string;
  created_at: string;
  user_profile?: {
    username: string;
    display_name: string;
  } | null;
}

interface EmailAliasManagerProps {
  familyId: string;
  primaryEmail: string;
  canManage?: boolean;
}

export const EmailAliasManager: React.FC<EmailAliasManagerProps> = ({
  familyId,
  primaryEmail,
  canManage = false,
}) => {
  const [aliases, setAliases] = useState<EmailAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAlias, setNewAlias] = useState({
    aliasEmail: '',
    role: 'child' as 'co_parent' | 'child' | 'guardian',
    userId: '',
  });
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailAliases();
    if (canManage) {
      fetchFamilyMembers();
    }
  }, [familyId]);

  const fetchEmailAliases = async () => {
    try {
      const { data, error } = await supabase
        .from('email_aliases')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAliases(data || []);
    } catch (error) {
      console.error('Error fetching email aliases:', error);
      toast({
        title: "Error",
        description: "Failed to load email aliases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const createEmailAlias = async () => {
    if (!newAlias.aliasEmail || !newAlias.userId) return;

    try {
      const { error } = await supabase
        .from('email_aliases')
        .insert({
          family_id: familyId,
          user_id: newAlias.userId,
          alias_email: newAlias.aliasEmail,
          primary_email: primaryEmail,
          role: newAlias.role,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Email Alias Created",
        description: `Successfully created alias ${newAlias.aliasEmail}`,
      });

      setShowAddDialog(false);
      setNewAlias({ aliasEmail: '', role: 'child', userId: '' });
      fetchEmailAliases();
    } catch (error) {
      console.error('Error creating email alias:', error);
      toast({
        title: "Error",
        description: "Failed to create email alias",
        variant: "destructive",
      });
    }
  };

  const toggleAliasStatus = async (aliasId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('email_aliases')
        .update({ is_active: !currentStatus })
        .eq('id', aliasId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Email alias ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchEmailAliases();
    } catch (error) {
      console.error('Error updating alias status:', error);
      toast({
        title: "Error",
        description: "Failed to update alias status",
        variant: "destructive",
      });
    }
  };

  const deleteEmailAlias = async (aliasId: string) => {
    try {
      const { error } = await supabase
        .from('email_aliases')
        .delete()
        .eq('id', aliasId);

      if (error) throw error;

      toast({
        title: "Email Alias Deleted",
        description: "Email alias has been permanently deleted",
      });

      fetchEmailAliases();
    } catch (error) {
      console.error('Error deleting email alias:', error);
      toast({
        title: "Error",
        description: "Failed to delete email alias",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'primary_parent': return 'bg-purple-100 text-purple-800';
      case 'co_parent': return 'bg-blue-100 text-blue-800';
      case 'guardian': return 'bg-green-100 text-green-800';
      case 'child': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'primary_parent':
      case 'co_parent':
      case 'guardian':
        return <Shield className="h-3 w-3" />;
      case 'child':
        return <Users className="h-3 w-3" />;
      default:
        return <Mail className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading email aliases...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Aliases
            </CardTitle>
            <CardDescription>
              Manage email aliases for family members under primary email: {primaryEmail}
            </CardDescription>
          </div>
          {canManage && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alias
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Email Alias</DialogTitle>
                  <DialogDescription>
                    Create a new email alias for a family member
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="familyMember">Family Member</Label>
                    <Select value={newAlias.userId} onValueChange={(value) => setNewAlias({ ...newAlias, userId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select family member" />
                      </SelectTrigger>
                      <SelectContent>
                        {familyMembers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.profiles?.display_name || member.profiles?.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="aliasEmail">Alias Email</Label>
                    <Input
                      id="aliasEmail"
                      type="email"
                      value={newAlias.aliasEmail}
                      onChange={(e) => setNewAlias({ ...newAlias, aliasEmail: e.target.value })}
                      placeholder="child@family-domain.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newAlias.role} 
                      onValueChange={(value: 'co_parent' | 'child' | 'guardian') => 
                        setNewAlias({ ...newAlias, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="co_parent">Co-Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={createEmailAlias} className="w-full">
                    Create Alias
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {aliases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No email aliases found</p>
            {canManage && (
              <p className="text-sm">Create aliases to manage family member emails</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {aliases.map((alias) => (
              <div key={alias.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{alias.alias_email}</span>
                    <Badge className={getRoleColor(alias.role)}>
                      <span className="flex items-center gap-1">
                        {getRoleIcon(alias.role)}
                        {alias.role.replace('_', ' ')}
                      </span>
                    </Badge>
                    {!alias.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    User ID: {alias.user_id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(alias.created_at).toLocaleDateString()}
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={alias.is_active}
                        onCheckedChange={() => toggleAliasStatus(alias.id, alias.is_active)}
                      />
                      <Label className="text-xs">Active</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEmailAlias(alias.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};