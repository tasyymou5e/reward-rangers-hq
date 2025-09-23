import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import { 
  Users, 
  Shield, 
  BarChart3, 
  Trophy, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  UserCog
} from "lucide-react";

export default function AdminDashboard() {
  const { profile } = useAdminAuth();
  const { toast } = useToast();
  const {
    fetchAllUsers,
    fetchAllFamilies,
    fetchAllChores,
    getAnalytics,
  } = useAdmin();
  
  const { alerts, getUnresolvedAlertsCount } = useSecurityMonitoring();

  // Permission helpers
  const isFullAdmin = () => ['admin', 'full_admin'].includes(profile?.role);
  const isReadOnlyAdmin = () => profile?.role === 'read_only_admin';
  const isReportAdmin = () => profile?.role === 'report_admin';
  const canViewAnalytics = () => ['admin', 'full_admin', 'report_admin'].includes(profile?.role);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFamilies: 0,
    totalChores: 0,
    completedChores: 0,
    activeUsers: 0,
    unresolvedAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        users,
        families,
        chores,
        analytics
      ] = await Promise.all([
        fetchAllUsers(),
        fetchAllFamilies(),
        fetchAllChores(),
        canViewAnalytics() ? getAnalytics() : Promise.resolve({})
      ]);

      const unresolvedAlerts = getUnresolvedAlertsCount();
      const completedChores = chores?.filter(chore => chore.status === 'completed').length || 0;
      const activeUsers = users?.filter(user => {
        const lastActivity = new Date(user.last_activity);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastActivity > oneWeekAgo;
      }).length || 0;

      setStats({
        totalUsers: users?.length || 0,
        totalFamilies: families?.length || 0,
        totalChores: chores?.length || 0,
        completedChores,
        activeUsers,
        unresolvedAlerts
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      show: true
    },
    {
      title: "Active Families",
      value: stats.totalFamilies,
      icon: UserCog,
      color: "text-green-600",
      bgColor: "bg-green-50",
      show: true
    },
    {
      title: "Total Chores",
      value: stats.totalChores,
      icon: Trophy,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      show: canViewAnalytics()
    },
    {
      title: "Completed Chores",
      value: stats.completedChores,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      show: canViewAnalytics()
    },
    {
      title: "Active Users (7d)",
      value: stats.activeUsers,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      show: canViewAnalytics()
    },
    {
      title: "Security Alerts",
      value: stats.unresolvedAlerts,
      icon: AlertTriangle,
      color: stats.unresolvedAlerts > 0 ? "text-red-600" : "text-gray-600",
      bgColor: stats.unresolvedAlerts > 0 ? "bg-red-50" : "bg-gray-50",
      show: isFullAdmin()
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-admin-primary">Admin Dashboard</h1>
          <Badge variant="outline" className="border-admin-primary text-admin-primary">
            {profile?.role?.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-primary">Admin Dashboard</h1>
          <p className="text-admin-secondary mt-1">
            Welcome back, {profile?.display_name}. Here's your system overview.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-admin-primary text-admin-primary">
            {profile?.role?.replace('_', ' ').toUpperCase()}
          </Badge>
          {stats.unresolvedAlerts > 0 && (
            <Badge variant="destructive">
              {stats.unresolvedAlerts} Alert{stats.unresolvedAlerts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.filter(card => card.show).map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-600">
              {isFullAdmin() ? "Manage user accounts and permissions" : "View user information"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">
              {canViewAnalytics() ? "View detailed reports and insights" : "Limited access"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-purple-600">
              {isFullAdmin() ? "Monitor security events and alerts" : "View only access"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-orange-600">
              {isFullAdmin() ? "Monitor system performance" : "Basic monitoring"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific notices */}
      {isReadOnlyAdmin() && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Read-Only Access</p>
                <p className="text-xs text-yellow-600">
                  You have view-only permissions. Contact a full admin for write access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isReportAdmin() && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Report Admin Access</p>
                <p className="text-xs text-blue-600">
                  You have full access to reports and analytics, with limited administrative functions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}