import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, TrendingUp, Award, Calendar, Clock, FileDown, Shield, MessageCircle, Brain } from "lucide-react";
import { MFASetup } from "@/components/MFASetup";
import { FamilyChat } from "@/components/FamilyChat";
import { PredictiveInsights } from "@/components/PredictiveInsights";
import { useReportGeneration } from "@/hooks/useReportGeneration";
import { useToast } from "@/hooks/use-toast";

export default function ParentsPortal() {
  const { generateWeeklyReport, generating } = useReportGeneration();
  const { toast } = useToast();

  const mockChildren = [
    { name: "Alex", level: 3, points: 125, completedToday: 2, totalChores: 5 },
    { name: "Emma", level: 2, points: 87, completedToday: 3, totalChores: 4 },
  ];

  const mockChores = [
    { title: "Make Bed", assignedTo: "Alex", status: "completed", points: 10 },
    { title: "Clean Room", assignedTo: "Emma", status: "pending", points: 25 },
    { title: "Take Out Trash", assignedTo: "Alex", status: "in-progress", points: 15 },
  ];

  const handleGenerateReport = async () => {
    try {
      await generateWeeklyReport();
      toast({
        title: "Report Generated",
        description: "Weekly family report has been generated and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-parents-background">
      <Header userType="parents" userName="Sarah" />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Family Overview */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-parents-primary">👨‍👩‍👧‍👦 Family Dashboard</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {mockChildren.map((child, index) => (
              <Card key={index} className="bg-white hover:shadow-parents hover:scale-105 transform transition-bounce">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">{child.name}</CardTitle>
                  <Badge className="bg-parents-primary text-white">Level {child.level}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Points</span>
                    <span className="font-bold text-parents-accent">{child.points} XP</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Today's Progress</span>
                      <span>{child.completedToday}/{child.totalChores}</span>
                    </div>
                    <Progress value={(child.completedToday / child.totalChores) * 100} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-parents-primary/10 to-parents-secondary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Children</CardTitle>
              <Users className="h-4 w-4 text-parents-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-parents-accent/10 to-parents-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-parents-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-parents-secondary/10 to-parents-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Pending</CardTitle>
              <Award className="h-4 w-4 text-parents-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-parents-primary/10 to-parents-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-parents-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-parents-primary">📋 Recent Chores</h2>
            <Button variant="parents">
              <Plus className="h-4 w-4 mr-2" />
              Add New Chore
            </Button>
          </div>
          
          <Card className="bg-white">
            <CardContent className="p-0">
              <div className="space-y-0">
                {mockChores.map((chore, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        chore.status === "completed" ? "bg-parents-primary" :
                        chore.status === "in-progress" ? "bg-parents-accent" : "bg-muted"
                      }`} />
                      <div>
                        <div className="font-medium">{chore.title}</div>
                        <div className="text-sm text-muted-foreground">Assigned to {chore.assignedTo}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{chore.points} XP</Badge>
                      <Badge className={
                        chore.status === "completed" ? "bg-parents-primary text-white" :
                        chore.status === "in-progress" ? "bg-parents-accent text-white" : "bg-muted"
                      }>
                        {chore.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Enhanced Features Tabs */}
        <Tabs defaultValue="chores" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chores">Quick Add</TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chores" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-parents-primary">✨ Quick Add Chore</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input placeholder="Chore title..." />
                  <Input placeholder="Points (XP)" type="number" />
                </div>
                <Textarea placeholder="Description..." />
                <div className="flex gap-4">
                  <Button variant="parents" className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Chore
                  </Button>
                  <Button variant="outline">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <MFASetup />
          </TabsContent>

          <TabsContent value="insights">
            <PredictiveInsights />
          </TabsContent>

          <TabsContent value="communication">
            <FamilyChat />
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-white border-parents-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-parents-primary">
                  <FileDown className="h-5 w-5" />
                  Family Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Export Options</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate comprehensive reports for sharing with co-parents, educators, or for your records.
                    </p>
                    <Button 
                      onClick={handleGenerateReport}
                      disabled={generating}
                      className="w-full bg-parents-primary hover:bg-parents-primary/90"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      {generating ? "Generating..." : "Generate Weekly Report"}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Report Features</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>• Chore completion statistics</li>
                      <li>• Individual child progress</li>
                      <li>• Points and rewards tracking</li>
                      <li>• Performance trends</li>
                      <li>• Family communication summary</li>
                      <li>• PDF format for easy sharing</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}