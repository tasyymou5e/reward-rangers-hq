import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BehavioralAnalyticsEngine } from "@/components/analytics/BehavioralAnalyticsEngine";
import { EnhancedPredictiveInsights } from "@/components/analytics/EnhancedPredictiveInsights";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Brain, TrendingUp, BarChart3, Eye } from "lucide-react";

export default function AdminAnalytics() {
  const { profile } = useAdminAuth();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Permission checks
  const canViewAnalytics = () => ['admin', 'full_admin', 'report_admin'].includes(profile?.role);

  if (!canViewAnalytics()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Access Restricted</h3>
            <p className="text-muted-foreground">
              You need analytics permissions to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-primary">Analytics Dashboard</h1>
          <p className="text-admin-secondary mt-1">
            Advanced analytics and behavioral insights for family engagement.
          </p>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="behavioral" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Behavioral
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Detailed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Analytics Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavioral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Behavioral Analytics Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Filter by Family (Optional)</label>
                    <select
                      value={selectedFamilyId || ""}
                      onChange={(e) => setSelectedFamilyId(e.target.value || null)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="">All Families</option>
                      {/* Add family options here */}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Filter by User (Optional)</label>
                    <select
                      value={selectedUserId || ""}
                      onChange={(e) => setSelectedUserId(e.target.value || null)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="">All Users</option>
                      {/* Add user options here */}
                    </select>
                  </div>
                </div>
                <BehavioralAnalyticsEngine
                  familyId={selectedFamilyId}
                  userId={selectedUserId}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Predictive Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Focus Family (Optional)</label>
                    <select
                      value={selectedFamilyId || ""}
                      onChange={(e) => setSelectedFamilyId(e.target.value || null)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="">All Families</option>
                      {/* Add family options here */}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Focus User (Optional)</label>
                    <select
                      value={selectedUserId || ""}
                      onChange={(e) => setSelectedUserId(e.target.value || null)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="">All Users</option>
                      {/* Add user options here */}
                    </select>
                  </div>
                </div>
                <EnhancedPredictiveInsights
                  familyId={selectedFamilyId}
                  userId={selectedUserId}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detailed Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Detailed Analytics</h3>
                <p className="text-muted-foreground">
                  Advanced analytics features coming soon. Integration with behavioral patterns and predictive models.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}