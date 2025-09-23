import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SecurityDashboard } from "@/components/SecurityDashboard";
import { 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Eye,
  Ban,
  UserX,
  Activity,
  Lock,
  Unlock,
  Download
} from "lucide-react";

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  investigated: boolean;
  investigated_by?: string;
  investigation_notes?: string;
}

interface ThreatAssessment {
  id: string;
  threat_type: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  affected_users: number;
  status: 'active' | 'mitigated' | 'resolved';
  created_at: string;
  updated_at: string;
}

export default function AdminSecurityCenter() {
  const { profile } = useAdminAuth();
  const { alerts, resolveAlert, getUnresolvedAlertsCount } = useSecurityMonitoring();
  const { toast } = useToast();

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [threatAssessments, setThreatAssessments] = useState<ThreatAssessment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Permission helpers
  const isFullAdmin = () => ['admin', 'full_admin'].includes(profile?.role);
  const canInvestigate = () => isFullAdmin();

  useEffect(() => {
    loadSecurityData();
    
    // Set up real-time monitoring for security events
    const interval = setInterval(loadSecurityData, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      // Mock security events data since tables don't exist yet
      const events = [
        {
          id: '1',
          event_type: 'failed_login',
          severity: 'medium' as const,
          created_at: new Date().toISOString(),
          investigated: false,
          details: { reason: 'Invalid password' },
          ip_address: '192.168.1.1'
        }
      ];

      // Mock threat assessments
      const threats = [
        {
          id: '1',
          threat_type: 'brute_force',
          risk_level: 'medium' as const,
          affected_users: 1,
          status: 'active' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setSecurityEvents(events || []);
      setThreatAssessments(threats || []);
    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvestigateEvent = async (eventId: string, notes: string) => {
    if (!canInvestigate()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to investigate security events",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          resolved: true,
          resolved_by: profile?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;

      await loadSecurityData();
      toast({
        title: "Event investigated",
        description: "Security event has been marked as investigated",
      });
    } catch (error) {
      console.error('Error investigating event:', error);
      toast({
        title: "Error",
        description: "Failed to mark event as investigated",
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async (userId: string, reason: string) => {
    if (!canInvestigate()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to block users",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update user status to blocked
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'kid' // Change role to restrict access instead
        })
        .eq('id', userId);

      if (error) throw error;

      // Create security event
      await supabase
        .from('security_alerts')
        .insert({
          alert_type: 'user_blocked',
          user_id: userId,
          description: `User blocked: ${reason}`,
          severity: 'high',
          metadata: { reason, blocked_by: profile?.id }
        });

      await loadSecurityData();
      toast({
        title: "User blocked",
        description: "User has been blocked for security reasons",
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    }
  };

  const exportSecurityReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      events: securityEvents,
      threats: threatAssessments,
      summary: {
        totalEvents: securityEvents.length,
        criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
        uninvestigated: securityEvents.filter(e => !e.investigated).length,
        activeThreats: threatAssessments.filter(t => t.status === 'active').length
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Security report exported",
      description: "Security report downloaded successfully",
    });
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter;
    const matchesType = typeFilter === "all" || event.event_type === typeFilter;
    return matchesSearch && matchesSeverity && matchesType;
  });

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">🛡️</div>
          <p className="text-lg">Loading security center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-primary flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Center
          </h1>
          <p className="text-admin-primary/70 mt-1">
            Monitor security events, investigate threats, and manage compliance
          </p>
        </div>
        
        <Button onClick={exportSecurityReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">
                  {securityEvents.filter(e => e.severity === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Uninvestigated</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {securityEvents.filter(e => !e.investigated).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Active Threats</p>
                <p className="text-2xl font-bold text-blue-600">
                  {threatAssessments.filter(t => t.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-green-600">
                  {securityEvents.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Security Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <SecurityDashboard />
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security Event Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-48">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="failed_login">Failed Login</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  <SelectItem value="data_access">Data Access</SelectItem>
                  <SelectItem value="admin_action">Admin Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Security Events ({filteredEvents.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.event_type}</TableCell>
                  <TableCell>
                    <Badge variant={getSeverityBadgeVariant(event.severity)} className="flex items-center gap-1 w-fit">
                      {getSeverityIcon(event.severity)}
                      {event.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.user_id || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {event.ip_address || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>
                    {new Date(event.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {event.investigated ? (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Investigated
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {!event.investigated && canInvestigate() && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInvestigateEvent(event.id, 'Investigated by admin')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {event.user_id && canInvestigate() && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlockUser(event.user_id!, 'Security incident')}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Threat Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Threat Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {threatAssessments.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No Active Threats</h3>
              <p className="text-gray-600">All identified threats have been mitigated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {threatAssessments.filter(t => t.status === 'active').map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={getSeverityBadgeVariant(threat.risk_level)}>
                      {threat.risk_level}
                    </Badge>
                    <div>
                      <p className="font-medium">{threat.threat_type}</p>
                      <p className="text-sm text-gray-600">
                        Affects {threat.affected_users} users
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(threat.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{threat.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}