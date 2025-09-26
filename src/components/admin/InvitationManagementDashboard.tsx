import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  Calendar,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface Invitation {
  id: string;
  invitee_email: string;
  invitee_name: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  invitation_code: string;
  families: {
    name: string;
    family_code: string;
  };
}

interface BulkInvitation {
  email: string;
  name: string;
  role: 'parent' | 'kid';
  familyId: string;
}

interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  acceptanceRate: number;
}

export function InvitationManagementDashboard() {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [bulkData, setBulkData] = useState<BulkInvitation[]>([]);
  const [bulkText, setBulkText] = useState("");
  const [stats, setStats] = useState<InvitationStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    expired: 0,
    acceptanceRate: 0
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_invitations')
        .select(`
          *,
          families (name, family_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const invitationsData = data.map(inv => ({
        ...inv,
        status: getInvitationStatus(inv)
      }));

      setInvitations(invitationsData);
      calculateStats(invitationsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInvitationStatus = (invitation: any): 'pending' | 'accepted' | 'declined' | 'expired' => {
    if (invitation.status === 'accepted') return 'accepted';
    if (invitation.status === 'declined') return 'declined';
    if (new Date(invitation.expires_at) < new Date()) return 'expired';
    return 'pending';
  };

  const calculateStats = (invitations: Invitation[]) => {
    const total = invitations.length;
    const pending = invitations.filter(inv => inv.status === 'pending').length;
    const accepted = invitations.filter(inv => inv.status === 'accepted').length;
    const declined = invitations.filter(inv => inv.status === 'declined').length;
    const expired = invitations.filter(inv => inv.status === 'expired').length;
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    setStats({ total, pending, accepted, declined, expired, acceptanceRate });
  };

  const handleBulkTextParse = () => {
    const lines = bulkText.trim().split('\n');
    const parsed: BulkInvitation[] = [];

    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          parsed.push({
            email: parts[0],
            name: parts[1],
            role: (parts[2]?.toLowerCase() === 'parent' ? 'parent' : 'kid') as 'parent' | 'kid',
            familyId: parts[3] || ''
          });
        }
      }
    }

    setBulkData(parsed);
  };

  const handleBulkInvite = async () => {
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const invitation of bulkData) {
        try {
          const { error } = await supabase.functions.invoke('send-family-invitation', {
            body: {
              familyId: invitation.familyId,
              inviteeEmail: invitation.email,
              inviteeName: invitation.name,
              role: invitation.role
            }
          });

          if (error) throw error;
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${invitation.email}: ${error.message}`);
        }
      }

      toast({
        title: "Bulk Invitation Complete",
        description: `Sent ${successCount} invitations. ${errorCount} failed.`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

      if (errors.length > 0) {
        console.error('Bulk invitation errors:', errors);
      }

      setShowBulkDialog(false);
      setBulkData([]);
      setBulkText("");
      loadInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send bulk invitations",
        variant: "destructive"
      });
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) return;

      const { error } = await supabase.functions.invoke('send-family-invitation', {
        body: {
          familyId: invitation.families.name, // This needs to be fixed with proper family ID
          inviteeEmail: invitation.invitee_email,
          inviteeName: invitation.invitee_name,
          role: invitation.role
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation Resent",
        description: `Invitation resent to ${invitation.invitee_email}`
      });

      loadInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInvitations = async () => {
    if (selectedInvitations.size === 0) return;

    try {
      const { error } = await supabase
        .from('family_invitations')
        .delete()
        .in('id', Array.from(selectedInvitations));

      if (error) throw error;

      toast({
        title: "Invitations Deleted",
        description: `Deleted ${selectedInvitations.size} invitations`
      });

      setSelectedInvitations(new Set());
      loadInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invitations",
        variant: "destructive"
      });
    }
  };

  const copyInvitationLink = (invitation: Invitation) => {
    const link = `${window.location.origin}/accept-invitation?code=${invitation.invitation_code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Invitation link copied to clipboard"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredInvitations = invitations.filter(inv => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesRole = roleFilter === "all" || inv.role === roleFilter;
    const matchesSearch = !searchTerm || 
      inv.invitee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invitee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.families.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Invitation Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage family invitations and track acceptance rates
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Bulk Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Family Invitations</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Invitation Data (CSV Format)</Label>
                  <Textarea
                    placeholder="email@example.com, John Doe, parent, family-id&#10;jane@example.com, Jane Smith, kid, family-id"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: email, name, role (parent/kid), family-id (one per line)
                  </p>
                </div>
                <Button onClick={handleBulkTextParse} variant="outline">
                  Parse Data
                </Button>
                {bulkData.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Preview ({bulkData.length} invitations)</h4>
                    <div className="max-h-40 overflow-y-auto border rounded p-2">
                      {bulkData.map((item, index) => (
                        <div key={index} className="text-sm p-1 border-b last:border-b-0">
                          {item.email} - {item.name} ({item.role})
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleBulkInvite} className="w-full">
                      Send All Invitations
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={loadInvitations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-muted-foreground">Accepted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            <div className="text-sm text-muted-foreground">Declined</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.acceptanceRate}%</div>
            <div className="text-sm text-muted-foreground">Accept Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search invitations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="kid">Child</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              {selectedInvitations.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteInvitations}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedInvitations.size})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations ({filteredInvitations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading invitations...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedInvitations.size === filteredInvitations.length && filteredInvitations.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedInvitations(new Set(filteredInvitations.map(inv => inv.id)));
                        } else {
                          setSelectedInvitations(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Invitee</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInvitations.has(invitation.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedInvitations);
                          if (checked) {
                            newSelected.add(invitation.id);
                          } else {
                            newSelected.delete(invitation.id);
                          }
                          setSelectedInvitations(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invitation.invitee_name}</div>
                        <div className="text-sm text-muted-foreground">{invitation.invitee_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invitation.families.name}</div>
                        <div className="text-sm text-muted-foreground">{invitation.families.family_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invitation.status)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className={invitation.status === 'expired' ? 'text-red-600' : ''}>
                        {format(new Date(invitation.expires_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInvitationLink(invitation)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {invitation.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvitation(invitation.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}