import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Users, Clock, Target, Plus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Competition {
  id: string;
  name: string;
  description: string;
  competition_type: string;
  status: string;
  start_date: string;
  end_date: string;
  rules: any;
  rewards: any;
  leaderboard: CompetitionParticipant[];
  created_by: string;
  family_id: string;
}

interface CompetitionParticipant {
  user_id: string;
  username: string;
  display_name: string;
  score: number;
  rank: number;
  progress: any;
}

export const FamilyCompetitions: React.FC<{ familyId: string; userId: string; isParent: boolean }> = ({ 
  familyId, 
  userId, 
  isParent 
}) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompetition, setNewCompetition] = useState({
    name: '',
    description: '',
    competition_type: 'weekly',
    duration_days: 7,
    rules: {
      scoring_method: 'points',
      bonus_multipliers: {}
    },
    rewards: {
      first_place: { points: 100, badge: 'gold_trophy' },
      second_place: { points: 50, badge: 'silver_trophy' },
      third_place: { points: 25, badge: 'bronze_trophy' }
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCompetitions();
  }, [familyId]);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_competitions')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const competitions = (data || []).map(c => ({
        ...c,
        leaderboard: Array.isArray(c.leaderboard) ? c.leaderboard as unknown as CompetitionParticipant[] : []
      })) as Competition[];
      setCompetitions(competitions);
      
      // Find active competition
      const active = competitions.find(c => c.status === 'active');
      if (active) {
        setActiveCompetition(active);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast({
        title: "Error",
        description: "Failed to load competitions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCompetition = async () => {
    if (!newCompetition.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Competition name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + newCompetition.duration_days);

      const { data, error } = await supabase
        .from('family_competitions')
        .insert({
          family_id: familyId,
          name: newCompetition.name,
          description: newCompetition.description,
          competition_type: newCompetition.competition_type,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          rules: newCompetition.rules,
          rewards: newCompetition.rewards,
          leaderboard: [],
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      const newComp: Competition = { ...data, leaderboard: [] };
      setCompetitions([newComp, ...competitions]);
      setActiveCompetition(newComp);
      setShowCreateForm(false);
      setNewCompetition({
        name: '',
        description: '',
        competition_type: 'weekly',
        duration_days: 7,
        rules: {
          scoring_method: 'points',
          bonus_multipliers: {}
        },
        rewards: {
          first_place: { points: 100, badge: 'gold_trophy' },
          second_place: { points: 50, badge: 'silver_trophy' },
          third_place: { points: 25, badge: 'bronze_trophy' }
        }
      });

      toast({
        title: "Competition Created",
        description: "New family competition has been started!",
      });
    } catch (error) {
      console.error('Error creating competition:', error);
      toast({
        title: "Error",
        description: "Failed to create competition",
        variant: "destructive"
      });
    }
  };

  const updateLeaderboard = async (competition: Competition) => {
    try {
      // Fetch current family member scores
      const { data: familyMembers } = await supabase
        .from('family_members')
        .select(`
          user_id,
          profiles:user_id (
            username,
            display_name,
            points
          )
        `)
        .eq('family_id', familyId);

      if (!familyMembers) return;

      // Calculate competition scores
      const leaderboard: CompetitionParticipant[] = [];
      
      for (const member of familyMembers) {
        const profile = member.profiles as any;
        
        // Get competition-specific progress
        const { data: competitionChores } = await supabase
          .from('chores')
          .select('points_value, completed_at')
          .eq('family_id', familyId)
          .eq('assigned_to', member.user_id)
          .eq('status', 'completed')
          .gte('completed_at', competition.start_date)
          .lte('completed_at', competition.end_date);

        const competitionScore = competitionChores?.reduce(
          (sum, chore) => sum + (chore.points_value || 0), 
          0
        ) || 0;

        leaderboard.push({
          user_id: member.user_id,
          username: profile.username,
          display_name: profile.display_name,
          score: competitionScore,
          rank: 0, // Will be calculated after sorting
          progress: {
            chores_completed: competitionChores?.length || 0,
            total_points: competitionScore
          }
        });
      }

      // Sort by score and assign ranks
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboard.forEach((participant, index) => {
        participant.rank = index + 1;
      });

      // Update competition with new leaderboard
      const { error } = await supabase
        .from('family_competitions')
        .update({ 
          leaderboard: leaderboard as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', competition.id);

      if (error) throw error;

      // Update local state
      setActiveCompetition(prev => prev ? { ...prev, leaderboard } : null);
      setCompetitions(prev => prev.map(c => 
        c.id === competition.id ? { ...c, leaderboard } : c
      ));
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  };

  const endCompetition = async (competition: Competition) => {
    try {
      await updateLeaderboard(competition);
      
      const { error } = await supabase
        .from('family_competitions')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString()
        })
        .eq('id', competition.id);

      if (error) throw error;

      // Award prizes to winners
      const leaderboard = competition.leaderboard as CompetitionParticipant[];
      if (leaderboard.length > 0) {
        // Award rewards based on ranking
        // This would integrate with the points/achievement system
      }

      await fetchCompetitions();
      setActiveCompetition(null);

      toast({
        title: "Competition Ended",
        description: "Winners have been determined and rewards distributed!",
      });
    } catch (error) {
      console.error('Error ending competition:', error);
      toast({
        title: "Error",
        description: "Failed to end competition",
        variant: "destructive"
      });
    }
  };

  const getCompetitionProgress = (competition: Competition) => {
    const now = new Date().getTime();
    const start = new Date(competition.start_date).getTime();
    const end = new Date(competition.end_date).getTime();
    
    return Math.min(((now - start) / (end - start)) * 100, 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(days, 0);
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500 text-white';
      case 2: return 'bg-gray-400 text-white';
      case 3: return 'bg-amber-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Family Competitions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Family Competitions
            </div>
            {isParent && (
              <Button onClick={() => setShowCreateForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Competition
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeCompetition ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{activeCompetition.name}</h3>
                  <p className="text-sm text-muted-foreground">{activeCompetition.description}</p>
                </div>
                <div className="text-right">
                  <Badge variant="default">Active</Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getDaysRemaining(activeCompetition.end_date)} days left
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Competition Progress</span>
                  <span>{Math.round(getCompetitionProgress(activeCompetition))}%</span>
                </div>
                <Progress value={getCompetitionProgress(activeCompetition)} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Leaderboard</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateLeaderboard(activeCompetition)}
                  >
                    Refresh
                  </Button>
                </div>

                {activeCompetition.leaderboard && activeCompetition.leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {(activeCompetition.leaderboard as CompetitionParticipant[]).map((participant) => (
                      <div key={participant.user_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={getRankBadgeColor(participant.rank)}>
                            #{participant.rank}
                          </Badge>
                          <div>
                            <div className="font-medium">{participant.display_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {participant.progress.chores_completed} chores completed
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{participant.score} points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No participants yet. Complete some chores to join the competition!
                  </div>
                )}
              </div>

              {isParent && (
                <Button 
                  variant="outline" 
                  onClick={() => endCompetition(activeCompetition)}
                  className="w-full"
                >
                  End Competition Early
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No active competitions. {isParent ? 'Create one to get started!' : 'Ask a parent to create one!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateForm && isParent && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Competition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Competition Name</label>
              <Input
                value={newCompetition.name}
                onChange={(e) => setNewCompetition(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Weekly Chore Challenge"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={newCompetition.description}
                onChange={(e) => setNewCompetition(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Complete as many chores as possible to earn points!"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select 
                  value={newCompetition.competition_type}
                  onValueChange={(value) => setNewCompetition(prev => ({ ...prev, competition_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Duration (days)</label>
                <Input
                  type="number"
                  value={newCompetition.duration_days}
                  onChange={(e) => setNewCompetition(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 7 }))}
                  min={1}
                  max={365}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createCompetition} className="flex-1">
                Create Competition
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {competitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Competition History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {competitions.filter(c => c.status === 'completed').slice(0, 5).map((competition) => (
                <div key={competition.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{competition.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Ended {new Date(competition.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};