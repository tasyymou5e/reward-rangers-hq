import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Activity, 
  Database, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Filter,
  Download
} from "lucide-react";

export default function AdminPortal() {
  const mockStats = {
    totalUsers: 1247,
    activeFamilies: 423,
    completedChores: 15678,
    totalPoints: 234567,
    systemHealth: 98.5,
    activeIssues: 3
  };

  const mockUsers = [
    { id: 1, name: "Johnson Family", children: 2, parents: 2, status: "active", joined: "2024-01-15" },
    { id: 2, name: "Smith Family", children: 3, parents: 1, status: "active", joined: "2024-02-03" },
    { id: 3, name: "Brown Family", children: 1, parents: 2, status: "suspended", joined: "2024-01-28" },
  ];

  return (
    <div className="min-h-screen bg-admin-background">
      <Header userType="admin" userName="Admin" />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* System Overview */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-admin-primary">⚙️ System Dashboard</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-admin-primary/10 to-admin-accent/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-admin-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-admin-accent/10 to-admin-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Families</CardTitle>
                <Activity className="h-4 w-4 text-admin-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.activeFamilies}</div>
                <p className="text-xs text-muted-foreground">+8% this week</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chores Done</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.completedChores.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Today: +247</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
                <Database className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalPoints.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.systemHealth}%</div>
                <p className="text-xs text-muted-foreground">Excellent</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.activeIssues}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* User Management */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-admin-primary">👥 User Management</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card className="bg-white">
            <CardHeader>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input placeholder="Search families..." className="max-w-md" />
                </div>
                <Button variant="admin">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {mockUsers.map((family, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-admin-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-admin-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{family.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {family.children} kids, {family.parents} parents
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-muted-foreground">
                        Joined {new Date(family.joined).toLocaleDateString()}
                      </div>
                      <Badge className={
                        family.status === "active" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      }>
                        {family.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* System Actions */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-admin-primary">🔧 System Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="admin" className="h-20 flex-col space-y-2">
              <Database className="h-6 w-6" />
              <span>Backup Data</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>User Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Shield className="h-6 w-6" />
              <span>Security Scan</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>Analytics</span>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}