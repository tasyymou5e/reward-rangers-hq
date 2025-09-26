import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Award, Calendar, Clock, FileDown, Shield, MessageCircle, Brain, Heart, User, UserPlus, ExternalLink, CheckCircle } from "lucide-react";
import { WishlistCard } from "@/components/WishlistCard";
import { ChoreAssignmentForm } from "@/components/ChoreAssignmentForm";
import { ChoreApprovalCard } from "@/components/ChoreApprovalCard";
import { AddChildForm } from "@/components/AddChildForm";
import { useWishlist } from "@/hooks/useWishlist";
import { useFamily } from "@/hooks/useFamily";
import { useChores } from "@/hooks/useChores";
import { MFASetup } from "@/components/MFASetup";
import { FamilyChat } from "@/components/FamilyChat";
import { PredictiveInsights } from "@/components/PredictiveInsights";
import { EnhancedMFASetup } from "@/components/mfa/EnhancedMFASetup";
import { useReportGeneration } from "@/hooks/useReportGeneration";
import { AffiliateDisplay } from "@/components/AffiliateDisplay";
import { AdvancedAchievementSystem } from "@/components/gamification/AdvancedAchievementSystem";
import { FamilyCompetitions } from "@/components/gamification/FamilyCompetitions";
import { useToast } from "@/hooks/use-toast";

export default function ParentsPortal() {
  const { generateWeeklyReport, generating } = useReportGeneration();
  const { wishlistItems, loading: wishlistLoading, approveWishlistItem, rejectWishlistItem } = useWishlist();
  const { family, familyMembers, loading: familyLoading } = useFamily();
  const { chores, approveChore, rejectChore, loading: choresLoading } = useChores();
  const { toast } = useToast();

  // Filter family members to show only children (not parents)
  const children = familyMembers
    .filter(member => member.profiles?.role === 'kid')
    .map(member => ({
      id: member.profiles.id,
      display_name: member.profiles.display_name,
      avatar_url: member.profiles.avatar_url,
      points: member.profiles.points || 0,
      level: member.profiles.level || 1,
      streak_days: member.profiles.streak_days || 0,
    }));

  // Calculate stats for children
  const childrenStats = children.map(child => {
    const childChores = chores.filter(chore => chore.assigned_to === child.id);
    const completedToday = childChores.filter(chore => {
      if (!chore.completed_at) return false;
      const completedDate = new Date(chore.completed_at);
      const today = new Date();
      return completedDate.toDateString() === today.toDateString();
    }).length;
    const totalChores = childChores.length;
    
    return {
      ...child,
      completedToday,
      totalChores,
      pendingChores: childChores.filter(chore => chore.status === 'pending').length,
    };
  });

  // Calculate recent chores with better assignment info
  const recentChores = chores.slice(0, 5).map(chore => ({
    id: chore.id,
    title: chore.title,
    assignedTo: chore.assigned_to_profile?.display_name || 'Unassigned',
    assignedToId: chore.assigned_to,
    status: chore.status,
    points: chore.points_value,
    difficulty: chore.difficulty,
  }));

  // Filter chores pending approval
  const pendingApprovalChores = chores.filter(chore => chore.status === 'pending_approval');

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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-parents-primary">👨‍👩‍👧‍👦 Family Dashboard</h2>
            <AddChildForm />
          </div>
          
          {familyLoading ? (
            <div className="text-center py-8">
              <div className="text-4xl animate-spin mb-4">⚡</div>
              <p>Loading family information...</p>
            </div>
          ) : children.length === 0 ? (
            <Card className="bg-white text-center p-8">
              <UserPlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Children in Family</h3>
              <p className="text-muted-foreground mb-4">
                Add children to your family to start assigning chores and tracking progress.
              </p>
              <div className="space-y-3">
                <AddChildForm />
                <p className="text-sm text-muted-foreground">
                  Family Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{family?.family_code}</span>
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {childrenStats.map((child) => (
                <Card key={child.id} className="bg-white hover:shadow-parents hover:scale-105 transform transition-bounce">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-kids-primary flex items-center justify-center text-white font-bold">
                        {child.avatar_url ? (
                          <img
                            src={child.avatar_url}
                            alt={child.display_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          child.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <CardTitle className="text-lg">{child.display_name}</CardTitle>
                    </div>
                    <Badge className="bg-parents-primary text-white">Level {child.level}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Points</span>
                      <span className="font-bold text-parents-accent">{child.points} XP</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-600">{child.completedToday}</div>
                        <div className="text-green-600">Completed Today</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-bold text-orange-600">{child.pendingChores}</div>
                        <div className="text-orange-600">Pending</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{child.completedToday}/{child.totalChores}</span>
                      </div>
                      <Progress 
                        value={child.totalChores > 0 ? (child.completedToday / child.totalChores) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                    {child.streak_days > 0 && (
                      <div className="text-center">
                        <Badge variant="outline" className="text-parents-accent border-parents-accent">
                          🔥 {child.streak_days} day streak
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-parents-primary/10 to-parents-secondary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Children</CardTitle>
              <Users className="h-4 w-4 text-parents-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-parents-accent/10 to-parents-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-parents-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {childrenStats.reduce((sum, child) => sum + child.completedToday, 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-parents-secondary/10 to-parents-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Chores</CardTitle>
              <Clock className="h-4 w-4 text-parents-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {chores.filter(chore => chore.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-parents-primary/10 to-parents-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chores</CardTitle>
              <Award className="h-4 w-4 text-parents-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chores.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-parents-primary">📋 Recent Chores</h2>
          </div>
          
          {choresLoading ? (
            <Card className="bg-white text-center p-8">
              <div className="text-4xl animate-spin mb-4">📋</div>
              <p>Loading chores...</p>
            </Card>
          ) : recentChores.length === 0 ? (
            <Card className="bg-white text-center p-8">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">No Chores Yet</h3>
              <p className="text-muted-foreground">Create your first chore using the form below!</p>
            </Card>
          ) : (
            <Card className="bg-white">
              <CardContent className="p-0">
                <div className="space-y-0">
                  {recentChores.map((chore) => (
                    <div key={chore.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          chore.status === "completed" ? "bg-parents-primary" :
                          chore.status === "in_progress" ? "bg-parents-accent" : "bg-orange-400"
                        }`} />
                        <div>
                          <div className="font-medium">{chore.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Assigned to {chore.assignedTo}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{chore.points} XP</Badge>
                        <Badge 
                          variant="outline"
                          className={`${
                            chore.difficulty === 'easy' ? 'border-green-500 text-green-600' :
                            chore.difficulty === 'medium' ? 'border-yellow-500 text-yellow-600' :
                            'border-red-500 text-red-600'
                          }`}
                        >
                          {chore.difficulty}
                        </Badge>
                        <Badge className={
                          chore.status === "completed" ? "bg-parents-primary text-white" :
                          chore.status === "in_progress" ? "bg-parents-accent text-white" : "bg-orange-400 text-white"
                        }>
                          {chore.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Enhanced Features Tabs */}
        <Tabs defaultValue={pendingApprovalChores.length > 0 ? "approvals" : "chores"} className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            {pendingApprovalChores.length > 0 && (
              <TabsTrigger value="approvals" className="flex items-center gap-2 relative">
                <CheckCircle className="h-4 w-4" />
                Approvals
                <Badge className="ml-1 bg-red-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center">
                  {pendingApprovalChores.length}
                </Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="children">
              <UserPlus className="h-4 w-4 mr-1" />
              Children
            </TabsTrigger>
            <TabsTrigger value="chores">Quick Add</TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Shopping
            </TabsTrigger>
          </TabsList>

          {pendingApprovalChores.length > 0 && (
            <TabsContent value="approvals" className="space-y-4">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-parents-primary flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Chore Approvals
                    <Badge className="bg-red-500 text-white">
                      {pendingApprovalChores.length} pending
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Review and approve completed chores to award points to your children.
                  </p>
                  <div className="grid gap-4">
                    {pendingApprovalChores.map((chore) => (
                      <ChoreApprovalCard
                        key={chore.id}
                        chore={chore}
                        onApprove={approveChore}
                        onReject={rejectChore}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="children" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-parents-primary flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Family Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Add New Child</h3>
                    <p className="text-sm text-muted-foreground">
                      Invite your children to join ChoreQuest via email
                    </p>
                  </div>
                  <AddChildForm />
                </div>

                {family && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Family Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Family Name</Label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {family.name}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Family Code</Label>
                        <div className="p-3 bg-gray-50 rounded-lg font-mono">
                          {family.family_code}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Share the family code with older children who can sign up themselves.
                    </p>
                  </div>
                )}

                {children.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Current Family Members</h4>
                    <div className="grid gap-3">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-kids-primary flex items-center justify-center text-white font-bold text-sm">
                              {child.avatar_url ? (
                                <img
                                  src={child.avatar_url}
                                  alt={child.display_name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                child.display_name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{child.display_name}</div>
                              <div className="text-sm text-muted-foreground">
                                Level {child.level} • {child.points} XP
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-kids-primary text-white">
                            Active
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chores" className="space-y-4">
            <ChoreAssignmentForm 
              children={children}
              onSuccess={() => {
                toast({
                  title: "Success!",
                  description: "Chores have been successfully assigned.",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-parents-primary">💝 Kids' Wishlist Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Review and approve your children's wishlist items. Help them set realistic goals and earn their dreams!
                </p>
                
                {wishlistLoading ? (
                  <div className="text-center py-8">
                    <div className="text-4xl animate-spin mb-4">💫</div>
                    <p>Loading wishlist items...</p>
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Wishlist Items Yet</h3>
                    <p className="text-muted-foreground">
                      Encourage your kids to add items to their wishlist to start setting goals!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="space-y-2">
                        <WishlistCard
                          item={item}
                          userPoints={0}
                          isParent={true}
                          onApprove={approveWishlistItem}
                          onReject={rejectWishlistItem}
                        />
                        {item.profiles && (
                          <div className="text-xs text-muted-foreground text-center">
                            by {item.profiles.display_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <EnhancedMFASetup />
          </TabsContent>

          <TabsContent value="insights">
            <PredictiveInsights />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <div className="space-y-6">
              <AdvancedAchievementSystem 
                userId={children[0]?.id} 
                familyId={family?.id} 
              />
              <FamilyCompetitions familyId={family?.id} />
            </div>
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


          <TabsContent value="shopping">
            <AffiliateDisplay 
              title="Partner Stores" 
              description="Discover trusted retail partners where your family can shop for rewards"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}