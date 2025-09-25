import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User, Plus, Edit, Shield, Users, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InternalIdentifier {
  id: string;
  family_id: string;
  user_id: string;
  internal_username: string;
  display_name: string;
  identifier_type: string;
  is_active: boolean;
  created_at: string;
  user_profile?: {
    username: string;
    display_name: string;
    email: string;
  };
}

interface InternalIdentifierManagerProps {
  familyId: string;
  familyName: string;
  familyMembers: any[];
  canManage?: boolean;
}

export const InternalIdentifierManager: React.FC<InternalIdentifierManagerProps> = ({
  familyId,
  familyName,
  familyMembers,
  canManage = false,
}) => {
  const [identifiers, setIdentifiers] = useState<InternalIdentifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newIdentifier, setNewIdentifier] = useState({
    userId: '',
    displayName: '',
    identifierType: 'child' as 'child' | 'parent' | 'guardian',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchInternalIdentifiers();
  }, [familyId]);

  const fetchInternalIdentifiers = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_identifiers')
        .select(`
          *,
          user_profile:profiles!internal_identifiers_user_id_fkey(
            username,
            display_name,
            email
          )
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdentifiers(data || []);
    } catch (error) {
      console.error('Error fetching internal identifiers:', error);
      toast({
        title: "Error",
        description: "Failed to load internal identifiers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInternalIdentifier = async () => {
    if (!newIdentifier.userId || !newIdentifier.displayName) return;

    try {
      // For now, generate identifier locally until function is available
      const cleanName = newIdentifier.displayName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const familyDomain = familyName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const generatedIdentifier = `${cleanName}@${familyDomain}.internal`;
      
      const { data, error } = await supabase
        .from('internal_identifiers')
        .insert({
          family_id: familyId,
          user_id: newIdentifier.userId,
          internal_username: generatedIdentifier,
          display_name: newIdentifier.displayName,
          identifier_type: newIdentifier.identifierType,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Internal Identifier Created",
        description: `Generated identifier: ${data.internal_username}`,
      });

      setShowCreateDialog(false);
      setNewIdentifier({ userId: '', displayName: '', identifierType: 'child' });
      fetchInternalIdentifiers();
    } catch (error) {
      console.error('Error creating internal identifier:', error);
      toast({
        title: "Error",
        description: "Failed to create internal identifier",
        variant: "destructive",
      });
    }
  };

  const toggleIdentifierStatus = async (identifierId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('internal_identifiers')
        .update({ is_active: !currentStatus })
        .eq('id', identifierId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Internal identifier ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchInternalIdentifiers();
    } catch (error) {
      console.error('Error updating identifier status:', error);
      toast({
        title: "Error",
        description: "Failed to update identifier status",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied",
        description: "Internal identifier copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'parent': return 'bg-purple-100 text-purple-800';
      case 'guardian': return 'bg-green-100 text-green-800';
      case 'child': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'parent':
      case 'guardian':
        return <Shield className="h-3 w-3" />;
      case 'child':
        return <Users className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getAvailableMembers = () => {
    const assignedUserIds = identifiers.map(id => id.user_id);
    return familyMembers.filter(member => !assignedUserIds.includes(member.user_id));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading internal identifiers...</div>
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
              <User className="h-5 w-5" />
              Internal Identifiers
            </CardTitle>
            <CardDescription>
              Create internal usernames for family members that don't require external email addresses
            </CardDescription>
          </div>
          {canManage && getAvailableMembers().length > 0 && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Identifier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Internal Identifier</DialogTitle>
                  <DialogDescription>
                    Generate an internal username for a family member. This allows them to use the system without needing an external email address.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="familyMember">Family Member</Label>
                    <Select value={newIdentifier.userId} onValueChange={(value) => 
                      setNewIdentifier({ ...newIdentifier, userId: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select family member" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableMembers().map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.profiles?.display_name || member.profiles?.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={newIdentifier.displayName}
                      onChange={(e) => setNewIdentifier({ ...newIdentifier, displayName: e.target.value })}
                      placeholder="Emma, John, etc."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be used to generate the internal username
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="identifierType">Type</Label>
                    <Select 
                      value={newIdentifier.identifierType} 
                      onValueChange={(value: 'child' | 'parent' | 'guardian') => 
                        setNewIdentifier({ ...newIdentifier, identifierType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                    <p className="font-medium">Preview:</p>
                    <p className="font-mono">
                      {newIdentifier.displayName ? 
                        `${newIdentifier.displayName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}@${familyName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}.internal` :
                        'name@family.internal'
                      }
                    </p>
                  </div>

                  <Button onClick={generateInternalIdentifier} className="w-full">
                    Generate Identifier
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {identifiers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No internal identifiers created</p>
            {canManage && (
              <p className="text-sm">Create identifiers for family members who don't need external email addresses</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {identifiers.map((identifier) => (
              <div key={identifier.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {identifier.internal_username}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(identifier.internal_username, identifier.id)}
                      >
                        {copiedId === identifier.id ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <Badge className={getTypeColor(identifier.identifier_type)}>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(identifier.identifier_type)}
                        {identifier.identifier_type}
                      </span>
                    </Badge>
                    {!identifier.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Display Name: {identifier.display_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Linked to: {identifier.user_profile?.display_name || identifier.user_profile?.username || 'Unknown User'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(identifier.created_at).toLocaleDateString()}
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={identifier.is_active}
                        onCheckedChange={() => toggleIdentifierStatus(identifier.id, identifier.is_active)}
                      />
                      <Label className="text-xs">Active</Label>
                    </div>
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