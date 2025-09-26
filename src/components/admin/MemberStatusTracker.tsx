import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Shield, 
  Activity,
  Clock,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FamilyMember {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  last_activity?: string;
  is_online?: boolean;
  joined_at: string;
  activity_summary?: {
    chores_completed: number;
    points_earned: number;
    streak_days: number;
  };
}

interface MemberStatusTrackerProps {
  familyId: string;
  members: FamilyMember[];
  onMemberUpdate: () => void;
}

export function MemberStatusTracker({ familyId, members, onMemberUpdate }: MemberStatusTrackerProps) {
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ open: boolean; member?: FamilyMember; newRole?: string }>({ open: false });
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});

  // Simulate online status tracking
  useEffect(() => {
    const updateOnlineStatuses = () => {
      const statuses: Record<string, boolean> = {};
      members.forEach(member => {
        // Simulate online status based on last activity
        const lastActivity = member.last_activity ? new Date(member.last_activity) : new Date(member.joined_at);
        const now = new Date();
        const minutesAgo = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
        statuses[member.user_id] = minutesAgo < 15; // Online if active within 15 minutes
      });
      setOnlineStatuses(statuses);
    };

    updateOnlineStatuses();
    const interval = setInterval(updateOnlineStatuses, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [members]);

  const handleMemberSelect = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map(m => m.user_id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedMembers.length === 0) return;

    try {
      switch (bulkAction) {
        case 'disable':
          // Bulk disable members - update profiles instead
          for (const memberId of selectedMembers) {
            await supabase
              .from('profiles')
              .update({ role: 'kid' })
              .eq('id', memberId);
          }
          toast({ title: 'Members updated successfully' });
          break;
        
        case 'enable':
          // Bulk enable members - restore to parent role
          for (const memberId of selectedMembers) {
            await supabase
              .from('profiles')
              .update({ role: 'parent' })
              .eq('id', memberId);
          }
          toast({ title: 'Members updated successfully' });
          break;
        
        case 'remove':
          // Bulk remove members
          for (const memberId of selectedMembers) {
            await supabase
              .from('family_members')
              .delete()
              .eq('user_id', memberId)
              .eq('family_id', familyId);
          }
          toast({ title: 'Members removed successfully' });
          break;
      }
      
      setSelectedMembers([]);
      setBulkAction('');
      onMemberUpdate();
    } catch (error) {
      toast({ 
        title: 'Bulk action failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeDialog.member || !roleChangeDialog.newRole) return;

    try {
      await supabase
        .from('profiles')
        .update({ role: roleChangeDialog.newRole as 'parent' | 'kid' | 'admin' })
        .eq('id', roleChangeDialog.member.user_id);

      toast({ title: 'Member role updated successfully' });
      setRoleChangeDialog({ open: false });
      onMemberUpdate();
    } catch (error) {
      toast({ 
        title: 'Role change failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    }
  };

  const getStatusBadge = (member: FamilyMember) => {
    const isOnline = onlineStatuses[member.user_id];
    const lastActivity = member.last_activity ? new Date(member.last_activity) : new Date(member.joined_at);
    const now = new Date();
    const hoursAgo = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (isOnline) {
      return <Badge variant="default" className="bg-success/10 text-success border-success/20">Online</Badge>;
    } else if (hoursAgo < 24) {
      return <Badge variant="secondary">Active today</Badge>;
    } else if (hoursAgo < 168) {
      return <Badge variant="outline">Active this week</Badge>;
    } else {
      return <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>;
    }
  };

  const formatLastSeen = (member: FamilyMember) => {
    const lastActivity = member.last_activity ? new Date(member.last_activity) : new Date(member.joined_at);
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Management
            <Badge variant="outline">{members.length} members</Badge>
          </CardTitle>
          
          {selectedMembers.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Bulk action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enable">Enable</SelectItem>
                  <SelectItem value="disable">Disable</SelectItem>
                  <SelectItem value="remove">Remove</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleBulkAction}
                disabled={!bulkAction}
                size="sm"
              >
                Apply to {selectedMembers.length}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedMembers.length === members.length && members.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Select all ({selectedMembers.length} selected)
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center space-x-4 p-3 rounded-lg border bg-card">
              <Checkbox
                checked={selectedMembers.includes(member.user_id)}
                onCheckedChange={(checked) => handleMemberSelect(member.user_id, checked as boolean)}
              />
              
              <Avatar>
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback>
                  {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{member.display_name}</p>
                  <Badge variant="outline" className="text-xs">
                    {member.role}
                  </Badge>
                  {getStatusBadge(member)}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLastSeen(member)}
                  </span>
                  
                  {member.activity_summary && (
                    <>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {member.activity_summary.chores_completed} chores
                      </span>
                      <span>{member.activity_summary.points_earned} points</span>
                      <span>{member.activity_summary.streak_days} day streak</span>
                    </>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setRoleChangeDialog({ open: true, member })}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Change Role
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserCheck className="h-4 w-4 mr-2" />
                    View Activity
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <UserX className="h-4 w-4 mr-2" />
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Role Change Dialog */}
      <Dialog open={roleChangeDialog.open} onOpenChange={(open) => setRoleChangeDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Change role for {roleChangeDialog.member?.display_name}
            </p>
            
            <Select
              value={roleChangeDialog.newRole}
              onValueChange={(value) => setRoleChangeDialog(prev => ({ ...prev, newRole: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kid">Child</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={!roleChangeDialog.newRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}