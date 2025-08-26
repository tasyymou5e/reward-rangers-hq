import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Shield, 
  BarChart3, 
  Trophy, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Ban, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  TestTube,
  Settings,
  Eye,
  X
} from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import { useABTesting } from "@/hooks/useABTesting";
import { supabase } from "@/integrations/supabase/client";

export default function AdminPortal() {
  const { profile, signOut } = useAdminAuth();
  const { toast } = useToast();
  const {
    fetchAllUsers,
    fetchAllFamilies,
    fetchAllChores,
    fetchProgressLogs,
    fetchBadges,
    createBadge,
    updateBadge,
    deleteBadge,
    banUser,
    getAnalytics,
  } = useAdmin();
  
  const { alerts, resolveAlert, getUnresolvedAlertsCount } = useSecurityMonitoring();
  const { 
    getAllTests, 
    createABTest, 
    updateABTest, 
    getTestAnalytics,
    assignUserToVariant 
  } = useABTesting();

  const [users, setUsers] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [chores, setChores] = useState<any[]>([]);
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [feedback, setFeedback] = useState<any[]>([]);
  const [abTests, setAbTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    icon: "",
    points_required: 0,
  });

  const [newABTest, setNewABTest] = useState({
    name: "",
    description: "",
    feature_key: "",
    variants: [
      { name: "control", config: {} },
      { name: "variant_a", config: {} }
    ],
    active: true,
    target_audience: {}
  });

  const [showABTestDialog, setShowABTestDialog] = useState(false);
  const [editingABTest, setEditingABTest] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        usersData,
        familiesData,
        choresData,
        logsData,
        badgesData,
        analyticsData,
        feedbackData,
        abTestsData,
      ] = await Promise.all([
        fetchAllUsers(),
        fetchAllFamilies(),
        fetchAllChores(),
        fetchProgressLogs(),
        fetchBadges(),
        getAnalytics(),
        fetchFeedback(),
        getAllTests(),
      ]);

      setUsers(usersData);
      setFamilies(familiesData);
      setChores(choresData);
      setProgressLogs(logsData);
      setBadges(badgesData);
      setAnalytics(analyticsData);
      setFeedback(feedbackData);
      setAbTests(abTestsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBadge = async () => {
    try {
      await createBadge(newBadge);
      setNewBadge({ name: "", description: "", icon: "", points_required: 0 });
      setShowBadgeDialog(false);
      await loadData();
      toast({
        title: "Success",
        description: "Badge created successfully",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to create badge",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBadge = async () => {
    if (!editingBadge) return;
    
    try {
      await updateBadge(editingBadge.id, newBadge);
      setEditingBadge(null);
      setNewBadge({ name: "", description: "", icon: "", points_required: 0 });
      setShowBadgeDialog(false);
      await loadData();
      toast({
        title: "Success",
        description: "Badge updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update badge",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    try {
      await deleteBadge(badgeId);
      await loadData();
      toast({
        title: "Success",
        description: "Badge deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete badge",
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      await banUser(userId, reason);
      await loadData();
      toast({
        title: "Success",
        description: "User banned successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openBadgeDialog = (badge?: any) => {
    if (badge) {
      setEditingBadge(badge);
      setNewBadge({
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        points_required: badge.points_required,
      });
    } else {
      setEditingBadge(null);
      setNewBadge({ name: "", description: "", icon: "", points_required: 0 });
    }
    setShowBadgeDialog(true);
  };

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select(`
          *,
          profiles!user_id (display_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  };

  const handleCreateABTest = async () => {
    try {
      await createABTest(newABTest);
      setNewABTest({
        name: "",
        description: "",
        feature_key: "",
        variants: [
          { name: "control", config: {} },
          { name: "variant_a", config: {} }
        ],
        active: true,
        target_audience: {}
      });
      setShowABTestDialog(false);
      await loadData();
      toast({
        title: "Success",
        description: "A/B test created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create A/B test",
        variant: "destructive",
      });
    }
  };

  const handleResolveFeedback = async (feedbackId: string, response: string) => {
    try {
      const { error } = await supabase
        .from('user_feedback')
        .update({
          status: 'resolved',
          admin_response: response,
          responded_by: profile?.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', feedbackId);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: "Feedback resolved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve feedback",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-spin">⚙️</div>
          <p className="text-xl font-bold text-admin-primary">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-background">
      <Header userType="admin" userName={profile?.display_name || "Administrator"} />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Admin Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-admin-primary" />
            <div>
              <h1 className="text-3xl font-bold text-admin-primary">Admin Dashboard</h1>
              <p className="text-muted-foreground">System administration and monitoring</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={signOut}
            className="text-admin-primary border-admin-primary hover:bg-admin-primary hover:text-white"
          >
            Sign Out
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-blue-700">{analytics.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Active Families</p>
                  <p className="text-3xl font-bold text-green-700">{analytics.totalFamilies}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Chores</p>
                  <p className="text-3xl font-bold text-purple-700">{analytics.totalChores}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-orange-700">{analytics.completionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-white shadow-md">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
              {getUnresolvedAlertsCount() > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1">
                  {getUnresolvedAlertsCount()}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="abtesting" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              A/B Tests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="families" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Families
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-admin-primary">User Management</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            <Card className="bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.display_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            user.role === 'admin' ? 'bg-red-500 text-white' :
                            user.role === 'parent' ? 'bg-blue-500 text-white' :
                            'bg-green-500 text-white'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.points || 0}</TableCell>
                        <TableCell>{user.level || 1}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 text-white">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBanUser(user.id, "Admin action")}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Alerts */}
          <TabsContent value="security" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-admin-primary">Security Monitoring</h2>
              <div className="flex items-center gap-4">
                <Badge className={`${getUnresolvedAlertsCount() > 0 ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                  {getUnresolvedAlertsCount()} Unresolved Alerts
                </Badge>
              </div>
            </div>

            <Card className="bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.slice(0, 20).map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge className={
                            alert.alert_type === 'failed_login_attempts' ? 'bg-red-500 text-white' :
                            alert.alert_type === 'unusual_location' ? 'bg-yellow-500 text-white' :
                            'bg-orange-500 text-white'
                          }>
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            alert.severity === 'high' ? 'bg-red-600 text-white' :
                            alert.severity === 'medium' ? 'bg-yellow-600 text-white' :
                            'bg-blue-600 text-white'
                          }>
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{alert.description}</TableCell>
                        <TableCell>{(alert as any).profiles?.display_name || 'Unknown'}</TableCell>
                        <TableCell>{new Date(alert.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={alert.resolved ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                            {alert.resolved ? 'Resolved' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!alert.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-admin-primary">User Feedback</h2>
              <Badge className="bg-blue-500 text-white">
                {feedback.filter(f => f.status === 'pending').length} Pending
              </Badge>
            </div>

            <div className="grid gap-4">
              {feedback.map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={
                            item.type === 'bug' ? 'bg-red-500 text-white' :
                            item.type === 'feature' ? 'bg-blue-500 text-white' :
                            item.type === 'improvement' ? 'bg-green-500 text-white' :
                            'bg-gray-500 text-white'
                          }>
                            {item.type}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            by {(item as any).profiles?.display_name}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <p className="text-muted-foreground mt-2">{item.description}</p>
                        {item.admin_response && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-800">Admin Response:</p>
                            <p className="text-green-700">{item.admin_response}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={item.status === 'resolved' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                          {item.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {item.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Respond
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Respond to Feedback</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const response = (form.elements.namedItem('response') as HTMLTextAreaElement).value;
                                handleResolveFeedback(item.id, response);
                              }}>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="response">Response</Label>
                                    <Textarea name="response" placeholder="Enter your response..." required />
                                  </div>
                                  <Button type="submit" className="w-full">
                                    Send Response
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* A/B Testing */}
          <TabsContent value="abtesting" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-admin-primary">A/B Testing</h2>
              <Button onClick={() => setShowABTestDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Test
              </Button>
            </div>

            <div className="grid gap-4">
              {abTests.map((test) => (
                <Card key={test.id} className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{test.name}</h3>
                          <Badge className={test.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}>
                            {test.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{test.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Feature: {test.feature_key}</span>
                          <span>Started: {new Date(test.start_date).toLocaleDateString()}</span>
                          {test.end_date && (
                            <span>Ends: {new Date(test.end_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                          View Results
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => updateABTest(test.id, { active: !test.active })}>
                          <Settings className="h-4 w-4" />
                          {test.active ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <p className="text-sm font-medium">Variants:</p>
                      <div className="flex gap-2">
                        {Array.isArray(test.variants) ? test.variants.map((variant: any, index: number) => (
                          <Badge key={index} variant="outline">
                            {variant.name || `Variant ${index + 1}`}
                          </Badge>
                        )) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Create A/B Test Dialog */}
            <Dialog open={showABTestDialog} onOpenChange={setShowABTestDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create A/B Test</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="test-name">Test Name</Label>
                    <Input
                      id="test-name"
                      value={newABTest.name}
                      onChange={(e) => setNewABTest(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter test name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="test-description">Description</Label>
                    <Textarea
                      id="test-description"
                      value={newABTest.description}
                      onChange={(e) => setNewABTest(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this test is for"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feature-key">Feature Key</Label>
                    <Input
                      id="feature-key"
                      value={newABTest.feature_key}
                      onChange={(e) => setNewABTest(prev => ({ ...prev, feature_key: e.target.value }))}
                      placeholder="e.g. new_gamification_system"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateABTest} className="flex-1">
                      Create Test
                    </Button>
                    <Button variant="outline" onClick={() => setShowABTestDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold text-admin-primary">System Analytics</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Chores Created:</span>
                    <span className="font-bold">{analytics.totalChores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chores Completed:</span>
                    <span className="font-bold">{analytics.completedChores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate:</span>
                    <span className="font-bold">{analytics.completionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Families:</span>
                    <span className="font-bold">{analytics.totalFamilies}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {progressLogs.slice(0, 5).map((log, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">{log.profiles?.display_name}</span>
                            {" "}
                            <span className="text-muted-foreground">{log.action}</span>
                            {" "}
                            <span className="font-medium">{log.chores?.title}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Badges Management */}
          <TabsContent value="badges" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-admin-primary">Badge Management</h2>
              <Button onClick={() => openBadgeDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Badge
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <Card key={badge.id} className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-4xl">{badge.icon || '🏆'}</div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBadgeDialog(badge)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBadge(badge.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">
                        {badge.points_required} points required
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Families */}
          <TabsContent value="families" className="space-y-6">
            <h2 className="text-2xl font-bold text-admin-primary">Family Management</h2>
            
            <div className="space-y-6">
              {families.map((family) => (
                <Card key={family.id} className="bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-admin-primary">
                        {family.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {family.family_code}
                        </code>
                        <Badge variant="outline">
                          {family.family_members?.length || 0} members
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(family.created_at).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Parent Information */}
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Parent
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Display Name</p>
                          <p className="text-sm text-gray-700">{family.profiles?.display_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600">Username</p>
                          <p className="text-sm text-gray-700">{family.profiles?.username || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600">Email</p>
                          <p className="text-sm text-gray-700">{family.profiles?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Children Information */}
                    {family.family_members && family.family_members.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Children ({family.family_members.length})
                        </h4>
                        <div className="space-y-3">
                          {family.family_members.map((member: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                  <p className="text-sm font-medium text-green-600">Display Name</p>
                                  <p className="text-sm text-gray-700">{member.profiles?.display_name || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-green-600">Username</p>
                                  <p className="text-sm text-gray-700">{member.profiles?.username || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-green-600">Email</p>
                                  <p className="text-sm text-gray-700">{member.profiles?.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-green-600">Role</p>
                                  <Badge className={
                                    member.profiles?.role === 'parent' ? 'bg-blue-500 text-white' :
                                    member.profiles?.role === 'kid' ? 'bg-green-500 text-white' :
                                    'bg-gray-500 text-white'
                                  }>
                                    {member.profiles?.role || 'Unknown'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No children message */}
                    {(!family.family_members || family.family_members.length === 0) && (
                      <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                        <p className="text-gray-600 text-sm italic">No children have joined this family yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* No families message */}
              {families.length === 0 && (
                <Card className="bg-white">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Families Found</h3>
                    <p className="text-gray-500">No family accounts have been created yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Activity Logs */}
          <TabsContent value="logs" className="space-y-6">
            <h2 className="text-2xl font-bold text-admin-primary">Activity Logs</h2>
            
            <Card className="bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Chore</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progressLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.profiles?.display_name}</TableCell>
                        <TableCell>
                          <Badge className={
                            log.action === 'completed' ? 'bg-green-500 text-white' :
                            log.action === 'started' ? 'bg-blue-500 text-white' :
                            'bg-red-500 text-white'
                          }>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.chores?.title}</TableCell>
                        <TableCell>{log.points_earned}</TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Badge Dialog */}
        <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBadge ? 'Edit Badge' : 'Create New Badge'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Badge Name</Label>
                <Input
                  id="name"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Super Helper"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newBadge.description}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Badge description"
                />
              </div>
              
              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={newBadge.icon}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🏆"
                />
              </div>
              
              <div>
                <Label htmlFor="points">Points Required</Label>
                <Input
                  id="points"
                  type="number"
                  value={newBadge.points_required}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, points_required: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={editingBadge ? handleUpdateBadge : handleCreateBadge}
                  className="flex-1"
                >
                  {editingBadge ? 'Update Badge' : 'Create Badge'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBadgeDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}