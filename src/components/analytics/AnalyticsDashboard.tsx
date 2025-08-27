import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import all analytics components
import { KPICards } from "./KPICards";
import { 
  UserGrowthChart, 
  ChoreCompletionChart, 
  FamilyEngagementChart, 
  SystemPerformanceChart,
  UserActivityPieChart,
  RevenueChart,
  ConversionRatesChart
} from "./ChartComponents";
import { DataTable } from "./DataTable";
import { RealTimeDashboard } from "./RealTimeDashboard";
import { ExportFunctionality } from "./ExportFunctionality";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";

export function AnalyticsDashboard() {
  const { toast } = useToast();
  const {
    loading,
    kpiData,
    userGrowthData,
    choreCompletionData,
    familyEngagementData,
    systemPerformanceData,
    userActivityData,
    revenueData,
    conversionData,
    refreshData
  } = useAnalyticsData();

  const [activeTab, setActiveTab] = useState("overview");

  const handleExport = async (format: string, dateRange: { from: Date; to: Date }, reportType: string) => {
    try {
      // Mock export functionality
      const fileName = `chorequest-${reportType}-${format}`;
      
      toast({
        title: "Export Started",
        description: `Generating ${format.toUpperCase()} report: ${fileName}`,
      });

      // Simulate export delay
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Report ${fileName} has been downloaded successfully.`,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating the report.",
        variant: "destructive",
      });
    }
  };

  const tableData = [
    {
      id: "1",
      name: "Smith Family",
      members: 4,
      choresCompleted: 28,
      pointsEarned: 560,
      status: "active",
      lastActivity: "2 hours ago"
    },
    {
      id: "2", 
      name: "Johnson Family",
      members: 3,
      choresCompleted: 22,
      pointsEarned: 440,
      status: "active",
      lastActivity: "1 day ago"
    },
    {
      id: "3",
      name: "Williams Family", 
      members: 5,
      choresCompleted: 35,
      pointsEarned: 700,
      status: "active",
      lastActivity: "3 hours ago"
    }
  ];

  const tableColumns = [
    { key: "name", label: "Family Name", sortable: true },
    { key: "members", label: "Members", sortable: true },
    { key: "choresCompleted", label: "Chores Completed", sortable: true },
    { key: "pointsEarned", label: "Points Earned", sortable: true },
    { key: "status", label: "Status", filterable: true },
    { key: "lastActivity", label: "Last Activity", sortable: true }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="tables">Data Tables</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <KPICards data={kpiData} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserGrowthChart data={userGrowthData} />
            <ChoreCompletionChart data={choreCompletionData} />
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserGrowthChart data={userGrowthData} />
            <ChoreCompletionChart data={choreCompletionData} />
            <FamilyEngagementChart data={familyEngagementData} />
            <SystemPerformanceChart data={systemPerformanceData} />
            <UserActivityPieChart data={userActivityData} />
            <RevenueChart data={revenueData} />
          </div>
          <ConversionRatesChart data={conversionData} />
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <DataTable
            title="Family Analytics"
            data={tableData}
            columns={tableColumns}
            searchPlaceholder="Search families..."
            onExport={(data) => handleExport("csv", { from: new Date(), to: new Date() }, "family_data")}
          />
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <RealTimeDashboard />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportFunctionality onExport={handleExport} />
        </TabsContent>
      </Tabs>
    </div>
  );
}