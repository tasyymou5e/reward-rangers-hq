import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import { useABTesting } from "@/hooks/useABTesting";
import { supabase } from "@/integrations/supabase/client";
import { UserManagementTab } from "@/components/UserManagementTab";
import { AffiliateManagement } from "@/components/AffiliateManagement";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
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
  X,
  ExternalLink,
  UserPlus,
  FileText,
  Download,
  Calendar as CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
    createUser,
  } = useAdmin();
  
  const { alerts, resolveAlert, getUnresolvedAlertsCount } = useSecurityMonitoring();
  const { 
    getAllTests, 
    createABTest, 
    updateABTest, 
    getTestAnalytics,
    assignUserToVariant 
  } = useABTesting();

  // Permission helpers
  const isFullAdmin = () => ['admin', 'full_admin'].includes(profile?.role);
  const isReadOnlyAdmin = () => profile?.role === 'read_only_admin';
  const isReportAdmin = () => profile?.role === 'report_admin';
  const canModify = () => !isReadOnlyAdmin(); // Read-only admins cannot modify
  const canManageUsers = () => isFullAdmin(); // Only full admins can manage users
  const canGenerateReports = () => ['admin', 'full_admin', 'report_admin'].includes(profile?.role);

  const [users, setUsers] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [chores, setChores] = useState<any[]>([]);
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [feedback, setFeedback] = useState<any[]>([]);
  const [abTests, setAbTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  
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

  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    display_name: "",
    role: "full_admin" as "admin" | "full_admin" | "read_only_admin" | "report_admin",
  });

  // Report generation state
  const [reportType, setReportType] = useState("family_progress");
  const [reportDateFrom, setReportDateFrom] = useState<Date>();
  const [reportDateTo, setReportDateTo] = useState<Date>();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

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
        .select('*')
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

  const handleCreateAdmin = async () => {
    try {
      await createUser(newAdmin);
      setShowAdminDialog(false);
      setNewAdmin({
        email: "",
        password: "",
        display_name: "",
        role: "full_admin",
      });
      await loadData();
      toast({
        title: "Admin created successfully",
        description: `New ${newAdmin.role.replace('_', ' ')} account created`,
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: "Failed to create admin user",
        variant: "destructive",
      });
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      let data = {};
      const fromDate = reportDateFrom ? reportDateFrom.toISOString() : null;
      const toDate = reportDateTo ? reportDateTo.toISOString() : null;

      switch (reportType) {
        case "family_progress":
          data = await generateFamilyProgressReport(fromDate, toDate);
          break;
        case "chore_completion":
          data = await generateChoreCompletionReport(fromDate, toDate);
          break;
        case "user_activity":
          data = await generateUserActivityReport(fromDate, toDate);
          break;
        case "system_overview":
          data = await generateSystemOverviewReport();
          break;
        default:
          data = {};
      }
      
      setReportData(data);
      toast({
        title: "Report generated successfully",
        description: `${reportType.replace('_', ' ')} report is ready`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const generateFamilyProgressReport = async (fromDate: string | null, toDate: string | null) => {
    const { data: families } = await supabase
      .from('families')
      .select(`
        *,
        family_members!inner(
          user_id,
          profiles!inner(display_name, role)
        )
      `);

    const { data: completedChores } = await supabase
      .from('chores')
      .select(`
        *,
        families!inner(name),
        profiles!inner(display_name)
      `)
      .eq('status', 'completed')
      .gte('completed_at', fromDate || '2000-01-01')
      .lte('completed_at', toDate || '2099-12-31');

    return {
      totalFamilies: families?.length || 0,
      completedChores: completedChores?.length || 0,
      familyDetails: families?.map(family => ({
        name: family.name,
        memberCount: family.family_members?.length || 0,
        completedChores: completedChores?.filter(chore => chore.family_id === family.id).length || 0
      })) || []
    };
  };

  const generateChoreCompletionReport = async (fromDate: string | null, toDate: string | null) => {
    const { data: chores } = await supabase
      .from('chores')
      .select(`
        *,
        profiles!inner(display_name),
        families!inner(name)
      `)
      .gte('created_at', fromDate || '2000-01-01')
      .lte('created_at', toDate || '2099-12-31');

    const completed = chores?.filter(chore => chore.status === 'completed').length || 0;
    const pending = chores?.filter(chore => chore.status === 'pending').length || 0;
    const total = chores?.length || 0;

    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      choresByFamily: chores?.reduce((acc: any, chore) => {
        const familyName = chore.families?.name || 'Unknown';
        if (!acc[familyName]) {
          acc[familyName] = { total: 0, completed: 0 };
        }
        acc[familyName].total++;
        if (chore.status === 'completed') {
          acc[familyName].completed++;
        }
        return acc;
      }, {}) || {}
    };
  };

  const generateUserActivityReport = async (fromDate: string | null, toDate: string | null) => {
    const { data: progressLogs } = await supabase
      .from('progress_logs')
      .select(`
        *,
        profiles!inner(display_name, role),
        families!inner(name)
      `)
      .gte('created_at', fromDate || '2000-01-01')
      .lte('created_at', toDate || '2099-12-31');

    const { data: users } = await supabase
      .from('profiles')
      .select('*');

    return {
      totalUsers: users?.length || 0,
      activeUsers: progressLogs?.length || 0,
      activityByRole: users?.reduce((acc: any, user) => {
        if (!acc[user.role]) acc[user.role] = 0;
        acc[user.role]++;
        return acc;
      }, {}) || {},
      recentActivity: progressLogs?.slice(0, 10) || []
    };
  };

  const generateSystemOverviewReport = async () => {
    const analytics = await getAnalytics();
    
    const { data: securityAlerts } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('resolved', false);

    const { data: feedback } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('status', 'pending');

    return {
      ...analytics,
      unresolvedAlerts: securityAlerts?.length || 0,
      pendingFeedback: feedback?.length || 0,
      systemHealth: 'Good' // This could be calculated based on various metrics
    };
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Report has been downloaded to your device",
    });
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
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">System administration and monitoring</p>
                <Badge className={
                  ['admin', 'full_admin'].includes(profile?.role) ? 'bg-red-500 text-white' :
                  profile?.role === 'read_only_admin' ? 'bg-blue-500 text-white' :
                  profile?.role === 'report_admin' ? 'bg-purple-500 text-white' :
                  'bg-gray-500 text-white'
                }>
                  {profile?.role?.replace('_', ' ') || 'Unknown Role'}
                </Badge>
                {isReadOnlyAdmin() && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Read Only Access
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('=== ADMIN LOGOUT BUTTON CLICKED ===');
              try {
                console.log('Calling signOut function...');
                await signOut();
                console.log('=== ADMIN LOGOUT COMPLETED SUCCESSFULLY ===');
              } catch (error) {
                console.error('=== ADMIN LOGOUT ERROR ===', error);
                console.error('Error details:', {
                  name: error?.name,
                  message: error?.message,
                  stack: error?.stack
                });
              }
            }}
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
          <TabsList className="grid w-full grid-cols-11 bg-white shadow-md">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Admins
            </TabsTrigger>
            {canManageUsers() && (
              <TabsTrigger value="user-mgmt" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Mgmt
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
              {getUnresolvedAlertsCount() > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1">
                  {getUnresolvedAlertsCount()}
                </span>
              )}
            </TabsTrigger>
            {canModify() && (
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback
              </TabsTrigger>
            )}
            {canModify() && (
              <TabsTrigger value="abtesting" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                A/B Tests
              </TabsTrigger>
            )}
            {canGenerateReports() && (
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
            )}
            {canModify() && (
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Badges
              </TabsTrigger>
            )}
            <TabsTrigger value="families" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Families
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            {canModify() && (
              <TabsTrigger value="affiliates" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Affiliates
              </TabsTrigger>
            )}
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab - Only for Full Admins */}
          {canManageUsers() && (
            <TabsContent value="user-mgmt" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-admin-primary">User & Family Management</h2>
              </div>
              <UserManagementTab />
            </TabsContent>
          )}

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-admin-primary">Admin Management</h2>
              <div className="flex gap-4">
                {canManageUsers() && (
                  <Button onClick={() => setShowAdminDialog(true)} className="bg-admin-primary hover:bg-admin-primary/90">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Admin
                  </Button>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search admins..."
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
                    {filteredUsers.filter(user => ['admin', 'full_admin', 'read_only_admin', 'report_admin'].includes(user.role)).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.display_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                         <TableCell>
                           <Badge className={
                             ['admin', 'full_admin'].includes(user.role) ? 'bg-red-500 text-white' :
                             user.role === 'read_only_admin' ? 'bg-blue-500 text-white' :
                             user.role === 'report_admin' ? 'bg-purple-500 text-white' :
                             user.role === 'parent' ? 'bg-green-500 text-white' :
                             'bg-gray-500 text-white'
                           }>
                             {user.role.replace('_', ' ')}
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
                             {canModify() && (
                               <>
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
                               </>
                             )}
                             {!canModify() && (
                               <Badge variant="outline" className="text-xs">
                                 Read Only Access
                               </Badge>
                             )}
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
                           {!alert.resolved && canModify() && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => resolveAlert(alert.id)}
                             >
                               <CheckCircle className="h-4 w-4" />
                               Resolve
                             </Button>
                           )}
                           {!canModify() && (
                             <Badge variant="outline" className="text-xs">
                               Read Only
                             </Badge>
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
                         {item.status === 'pending' && canModify() && (
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
                         {!canModify() && (
                           <Badge variant="outline" className="text-xs">
                             Read Only
                           </Badge>
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
              {canModify() && (
                <Button onClick={() => setShowABTestDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Test
                </Button>
              )}
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
                         {canModify() && (
                           <Button variant="outline" size="sm" onClick={() => updateABTest(test.id, { active: !test.active })}>
                             <Settings className="h-4 w-4" />
                             {test.active ? 'Disable' : 'Enable'}
                           </Button>
                         )}
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

          {/* Reports Tab */}
          {canGenerateReports() && (
            <TabsContent value="reports" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-admin-primary">Report Generation</h2>
                <Badge className={
                  ['admin', 'full_admin'].includes(profile?.role) ? 'bg-red-500 text-white' :
                  profile?.role === 'report_admin' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                }>
                  {profile?.role?.replace('_', ' ') || 'Unknown Role'}
                </Badge>
              </div>

              {/* Report Configuration */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generate Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="report-type">Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="family_progress">📊 Family Progress Report</SelectItem>
                          <SelectItem value="chore_completion">✅ Chore Completion Report</SelectItem>
                          <SelectItem value="user_activity">👥 User Activity Report</SelectItem>
                          <SelectItem value="system_overview">🔍 System Overview Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Date From</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !reportDateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {reportDateFrom ? format(reportDateFrom, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={reportDateFrom}
                            onSelect={setReportDateFrom}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label>Date To</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !reportDateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {reportDateTo ? format(reportDateTo, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={reportDateTo}
                            onSelect={setReportDateTo}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      onClick={generateReport} 
                      disabled={generatingReport}
                      className="bg-admin-primary hover:bg-admin-primary/90"
                    >
                      {generatingReport ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report
                        </>
                      )}
                    </Button>
                    
                    {reportData && (
                      <Button variant="outline" onClick={exportReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Report Results */}
              {reportData && (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Report Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportType === 'family_progress' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-700">{reportData.totalFamilies}</p>
                            <p className="text-blue-600">Total Families</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{reportData.completedChores}</p>
                            <p className="text-green-600">Completed Chores</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-700">
                              {reportData.totalFamilies > 0 ? Math.round(reportData.completedChores / reportData.totalFamilies) : 0}
                            </p>
                            <p className="text-purple-600">Avg. Chores/Family</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2">Family Details</h3>
                          <div className="space-y-2">
                            {reportData.familyDetails?.map((family: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>{family.name}</span>
                                <div className="text-sm text-gray-600">
                                  {family.memberCount} members • {family.completedChores} chores completed
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {reportType === 'chore_completion' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-700">{reportData.total}</p>
                            <p className="text-blue-600">Total Chores</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{reportData.completed}</p>
                            <p className="text-green-600">Completed</p>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-700">{reportData.pending}</p>
                            <p className="text-yellow-600">Pending</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-700">{reportData.completionRate}%</p>
                            <p className="text-purple-600">Completion Rate</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2">Completion by Family</h3>
                          <div className="space-y-2">
                            {Object.entries(reportData.choresByFamily || {}).map(([familyName, data]: [string, any]) => (
                              <div key={familyName} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>{familyName}</span>
                                <div className="text-sm text-gray-600">
                                  {data.completed}/{data.total} ({Math.round((data.completed / data.total) * 100)}%)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {reportType === 'user_activity' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-700">{reportData.totalUsers}</p>
                            <p className="text-blue-600">Total Users</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{reportData.activeUsers}</p>
                            <p className="text-green-600">Active Users</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2">Users by Role</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {Object.entries(reportData.activityByRole || {}).map(([role, count]: [string, any]) => (
                              <div key={role} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="capitalize">{role.replace('_', ' ')}</span>
                                <Badge variant="outline">{count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {reportType === 'system_overview' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-700">{reportData.totalUsers}</p>
                            <p className="text-blue-600">Total Users</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{reportData.totalFamilies}</p>
                            <p className="text-green-600">Active Families</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-700">{reportData.totalChores}</p>
                            <p className="text-purple-600">Total Chores</p>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <p className="text-2xl font-bold text-orange-700">{reportData.completionRate}%</p>
                            <p className="text-orange-600">Completion Rate</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-2xl font-bold text-red-700">{reportData.unresolvedAlerts}</p>
                            <p className="text-red-600">Security Alerts</p>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-700">{reportData.pendingFeedback}</p>
                            <p className="text-yellow-600">Pending Feedback</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{reportData.systemHealth}</p>
                            <p className="text-green-600">System Health</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Badges Management */}
          <TabsContent value="badges" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-admin-primary">Badge Management</h2>
              {canModify() && (
                <Button onClick={() => openBadgeDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Badge
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <Card key={badge.id} className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                       <div className="text-4xl">{badge.icon || '🏆'}</div>
                       {canModify() && (
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
                       )}
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

          {/* Affiliates Management */}
          <TabsContent value="affiliates" className="space-y-6">
            <AffiliateManagement />
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

        {/* Admin Creation Dialog */}
        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-admin-primary" />
                Create New Admin
              </DialogTitle>
              <DialogDescription>
                Create a new admin user with role-based permissions for the admin portal.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email Address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Secure password (min 6 characters)"
                />
              </div>
              
              <div>
                <Label htmlFor="admin-name">Display Name</Label>
                <Input
                  id="admin-name"
                  value={newAdmin.display_name}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              
              <div>
                <Label htmlFor="admin-role">Admin Role</Label>
                <Select 
                  value={newAdmin.role} 
                  onValueChange={(value: "admin" | "full_admin" | "read_only_admin" | "report_admin") => 
                    setNewAdmin(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">🔴 Legacy Admin (Full Access)</SelectItem>
                    <SelectItem value="full_admin">🔴 Full Admin (Complete Control)</SelectItem>
                    <SelectItem value="read_only_admin">🔵 Read Only Admin (View Only)</SelectItem>
                    <SelectItem value="report_admin">🟣 Report Admin (Reports & Limited)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose the appropriate permission level for this admin user
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateAdmin}
                  className="flex-1 bg-admin-primary hover:bg-admin-primary/90"
                  disabled={!newAdmin.email || !newAdmin.password || !newAdmin.display_name}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Admin
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAdminDialog(false)}
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