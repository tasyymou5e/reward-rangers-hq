import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { 
  BarChart3, 
  Download,
  Calendar as CalendarIcon,
  FileText,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminReports() {
  const { profile } = useAdminAuth();
  const { toast } = useToast();

  // Permission helpers
  const isFullAdmin = () => ['admin', 'full_admin'].includes(profile?.role);
  const isReadOnlyAdmin = () => profile?.role === 'read_only_admin';
  const isReportAdmin = () => profile?.role === 'report_admin';
  const canGenerateReports = () => ['admin', 'full_admin', 'report_admin'].includes(profile?.role);

  const [reportType, setReportType] = useState("family_progress");
  const [reportDateFrom, setReportDateFrom] = useState<Date>();
  const [reportDateTo, setReportDateTo] = useState<Date>();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const reportTypes = [
    { value: "family_progress", label: "Family Progress Report", description: "Track family chore completion and engagement" },
    { value: "chore_completion", label: "Chore Completion Report", description: "Analyze chore completion rates and trends" },
    { value: "user_activity", label: "User Activity Report", description: "Monitor user engagement and activity patterns" },
    { value: "system_overview", label: "System Overview Report", description: "Overall platform performance and metrics" }
  ];

  const generateReport = async () => {
    if (!canGenerateReports()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to generate reports",
        variant: "destructive",
      });
      return;
    }

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
      .select('id, display_name, role, created_at');

    return {
      totalUsers: users?.length || 0,
      activeUsers: progressLogs?.length || 0,
      usersByRole: users?.reduce((acc: any, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}) || {},
      activityByFamily: progressLogs?.reduce((acc: any, log) => {
        const familyName = log.families?.name || 'Unknown';
        acc[familyName] = (acc[familyName] || 0) + 1;
        return acc;
      }, {}) || {}
    };
  };

  const generateSystemOverviewReport = async () => {
    const { data: users } = await supabase.from('profiles').select('*');
    const { data: families } = await supabase.from('families').select('*');
    const { data: chores } = await supabase.from('chores').select('*');
    const { data: progressLogs } = await supabase.from('progress_logs').select('*');

    const completedChores = chores?.filter(chore => chore.status === 'completed').length || 0;
    const totalChores = chores?.length || 0;

    return {
      totalUsers: users?.length || 0,
      totalFamilies: families?.length || 0,
      totalChores,
      completedChores,
      completionRate: totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0,
      totalActivities: progressLogs?.length || 0,
      usersByRole: users?.reduce((acc: any, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}) || {}
    };
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportJson = JSON.stringify(reportData, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Report data downloaded successfully",
    });
  };

  if (!canGenerateReports()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 text-gray-400 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view reports</p>
          </div>
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
            <BarChart3 className="h-6 w-6" />
            Reports & Analytics
          </h1>
          <p className="text-admin-primary/70 mt-1">
            Generate comprehensive reports and view analytics
          </p>
        </div>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">From Date</label>
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
                    {reportDateFrom ? format(reportDateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reportDateFrom}
                    onSelect={setReportDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
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
                    {reportDateTo ? format(reportDateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reportDateTo}
                    onSelect={setReportDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {reportTypes.find(t => t.value === reportType)?.description}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateReport}
                disabled={generatingReport}
                className="bg-admin-primary hover:bg-admin-primary/90"
              >
                {generatingReport ? (
                  <>Generating...</>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
              {reportData && (
                <Button onClick={exportReport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportType === "family_progress" && (
                <div>
                  <h3 className="font-semibold mb-2">Family Progress Summary</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{reportData.totalFamilies}</div>
                      <div className="text-sm text-blue-600">Total Families</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{reportData.completedChores}</div>
                      <div className="text-sm text-green-600">Completed Chores</div>
                    </div>
                  </div>
                  {reportData.familyDetails && reportData.familyDetails.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Family Details</h4>
                      <div className="space-y-2">
                        {reportData.familyDetails.map((family: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded">
                            <span>{family.name}</span>
                            <div className="text-sm text-gray-600">
                              {family.memberCount} members, {family.completedChores} chores completed
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {reportType === "chore_completion" && (
                <div>
                  <h3 className="font-semibold mb-2">Chore Completion Summary</h3>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{reportData.total}</div>
                      <div className="text-sm text-blue-600">Total Chores</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{reportData.completed}</div>
                      <div className="text-sm text-green-600">Completed</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{reportData.pending}</div>
                      <div className="text-sm text-yellow-600">Pending</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{reportData.completionRate}%</div>
                      <div className="text-sm text-purple-600">Completion Rate</div>
                    </div>
                  </div>
                </div>
              )}

              {reportType === "user_activity" && (
                <div>
                  <h3 className="font-semibold mb-2">User Activity Summary</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{reportData.totalUsers}</div>
                      <div className="text-sm text-blue-600">Total Users</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{reportData.activeUsers}</div>
                      <div className="text-sm text-green-600">Active Users</div>
                    </div>
                  </div>
                </div>
              )}

              {reportType === "system_overview" && (
                <div>
                  <h3 className="font-semibold mb-2">System Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{reportData.totalUsers}</div>
                      <div className="text-sm text-blue-600">Total Users</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{reportData.totalFamilies}</div>
                      <div className="text-sm text-green-600">Total Families</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{reportData.totalChores}</div>
                      <div className="text-sm text-purple-600">Total Chores</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{reportData.completionRate}%</div>
                      <div className="text-sm text-orange-600">Completion Rate</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsDashboard />
        </CardContent>
      </Card>
    </div>
  );
}