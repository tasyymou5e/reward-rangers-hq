import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnhancedAdmin } from "@/hooks/useEnhancedAdmin";
import { 
  Shield, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  Download
} from "lucide-react";

export function EnhancedAdminDashboard() {
  const {
    permissions,
    auditTrail,
    bulkOperations,
    loading,
    hasPermission,
    fetchAuditTrail,
    createBulkOperation
  } = useEnhancedAdmin();

  const [auditFilter, setAuditFilter] = useState({
    action_type: '',
    risk_level: '',
    search: ''
  });

  const [bulkData, setBulkData] = useState({
    operation_type: '',
    csv_data: ''
  });

  const handleAuditFilter = () => {
    fetchAuditTrail({
      action_type: auditFilter.action_type || undefined,
      risk_level: auditFilter.risk_level || undefined
    });
  };

  const handleBulkOperation = async () => {
    if (!bulkData.operation_type || !bulkData.csv_data) return;

    try {
      const items = bulkData.csv_data.split('\n').filter(line => line.trim());
      await createBulkOperation(bulkData.operation_type, { items });
      setBulkData({ operation_type: '', csv_data: '' });
    } catch (error) {
      console.error('Failed to create bulk operation:', error);
    }
  };

  const getRiskLevelColor = (level: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'outline';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-lg">Loading enhanced admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissions.map((perm) => (
              <Badge key={perm.id} variant="secondary">
                {perm.permission.replace('_', ' ')}
                {perm.expires_at && (
                  <span className="ml-1 text-xs opacity-70">
                    (expires {new Date(perm.expires_at).toLocaleDateString()})
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Security Audit</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        {/* Security Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Security Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search audit logs..."
                    value={auditFilter.search}
                    onChange={(e) => setAuditFilter({ ...auditFilter, search: e.target.value })}
                  />
                </div>
                <Select value={auditFilter.action_type} onValueChange={(value) => setAuditFilter({ ...auditFilter, action_type: value })}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    <SelectItem value="profile_updated">Profile Updated</SelectItem>
                    <SelectItem value="permission_granted">Permission Granted</SelectItem>
                    <SelectItem value="child_password_reset">Password Reset</SelectItem>
                    <SelectItem value="family_joined">Family Joined</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={auditFilter.risk_level} onValueChange={(value) => setAuditFilter({ ...auditFilter, risk_level: value })}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAuditFilter}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Audit Trail */}
              <div className="space-y-2">
                {auditTrail.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={getRiskLevelColor(entry.risk_level)}>
                          {entry.risk_level}
                        </Badge>
                        <span className="font-medium">{entry.action_type.replace('_', ' ')}</span>
                        <span className="text-sm text-muted-foreground">
                          on {entry.resource_type}
                        </span>
                        {entry.resource_id && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            ID: {entry.resource_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-4">
          {hasPermission('bulk_operations') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Create Bulk Operation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={bulkData.operation_type} onValueChange={(value) => setBulkData({ ...bulkData, operation_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_families">Create Families</SelectItem>
                    <SelectItem value="create_users">Create Users</SelectItem>
                    <SelectItem value="update_permissions">Update Permissions</SelectItem>
                    <SelectItem value="export_data">Export Data</SelectItem>
                  </SelectContent>
                </Select>
                
                <div>
                  <label className="text-sm font-medium">CSV Data</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md"
                    rows={6}
                    placeholder="Paste CSV data here (one item per line)..."
                    value={bulkData.csv_data}
                    onChange={(e) => setBulkData({ ...bulkData, csv_data: e.target.value })}
                  />
                </div>
                
                <Button 
                  onClick={handleBulkOperation}
                  disabled={!bulkData.operation_type || !bulkData.csv_data}
                >
                  Create Bulk Operation
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bulk Operations History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bulk Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bulkOperations.map((op) => (
                  <div key={op.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusColor(op.status)}>
                          {op.status}
                        </Badge>
                        <span className="font-medium">{op.operation_type}</span>
                        <span className="text-sm text-muted-foreground">
                          {op.processed_items}/{op.total_items} items
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(op.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    {op.status === 'running' && (
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(op.processed_items / op.total_items) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {op.failed_items > 0 && (
                      <div className="mt-2 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        {op.failed_items} items failed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">24</div>
                <p className="text-sm text-muted-foreground">Users online now</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Security Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">3</div>
                <p className="text-sm text-muted-foreground">Pending review</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-medium">Healthy</span>
                </div>
                <p className="text-sm text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}