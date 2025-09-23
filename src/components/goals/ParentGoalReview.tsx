import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/hooks/useFamily';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, User, Target, Star } from 'lucide-react';

interface GoalProposal {
  id: string;
  title: string;
  description: string;
  proposed_points: number;
  status: string;
  created_at: string;
  child_id: string;
  parent_feedback: string | null;
  profiles?: {
    display_name: string;
    username: string;
  } | null;
}

export default function ParentGoalReview() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [proposals, setProposals] = useState<GoalProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [adjustedPoints, setAdjustedPoints] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchProposals();
  }, [family]);

  const fetchProposals = async () => {
    if (!family) return;

    try {
      const { data, error } = await supabase
        .from('child_goal_proposals')
        .select(`
          *,
          profiles!child_id (
            display_name,
            username
          )
        `)
        .eq('family_id', family.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProposals(data || []);
      
      // Initialize feedback and adjusted points
      const feedbackInit: { [key: string]: string } = {};
      const pointsInit: { [key: string]: number } = {};
      data?.forEach(proposal => {
        feedbackInit[proposal.id] = proposal.parent_feedback || '';
        pointsInit[proposal.id] = proposal.proposed_points;
      });
      setFeedback(feedbackInit);
      setAdjustedPoints(pointsInit);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load goal proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (proposalId: string, approved: boolean) => {
    setProcessingId(proposalId);
    try {
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) return;

      const updateData = {
        status: approved ? 'approved' : 'rejected',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        parent_feedback: feedback[proposalId] || null
      };

      const { error: updateError } = await supabase
        .from('child_goal_proposals')
        .update(updateData)
        .eq('id', proposalId);

      if (updateError) throw updateError;

      // If approved, create a chore from the goal
      if (approved) {
        const finalPoints = adjustedPoints[proposalId] || proposal.proposed_points;
        
        const { error: choreError } = await supabase
          .from('chores')
          .insert({
            family_id: family?.id,
            title: proposal.title,
            description: proposal.description,
            points_value: finalPoints,
            assigned_to: proposal.child_id,
            created_by: user?.id,
            status: 'pending'
          });

        if (choreError) throw choreError;

        toast.success(`Goal approved and converted to a chore! ${proposal.profiles?.display_name} can now work on it.`);
      } else {
        toast.success(`Goal ${approved ? 'approved' : 'rejected'} successfully.`);
      }

      await fetchProposals();
    } catch (error) {
      console.error('Error processing proposal:', error);
      toast.error('Failed to process proposal. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No goal proposals yet.</p>
          <p className="text-sm text-muted-foreground">
            Children can submit goal proposals that you can review and approve.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Goal Proposals</h2>
        <Badge variant="secondary">{proposals.filter(p => p.status === 'pending').length} pending</Badge>
      </div>

      {proposals.map((proposal) => (
        <Card key={proposal.id} className="w-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  {proposal.title}
                  {getStatusIcon(proposal.status)}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {proposal.profiles?.display_name || 'Unknown Child'}
                  <span className="text-xs">
                    • {new Date(proposal.created_at).toLocaleDateString()}
                  </span>
                </CardDescription>
              </div>
              <Badge className={getStatusColor(proposal.status)}>
                {proposal.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposal.description && (
              <p className="text-sm text-muted-foreground">
                {proposal.description}
              </p>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  Proposed: {proposal.proposed_points} points
                </span>
              </div>
            </div>

            {proposal.status === 'pending' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adjust Points (Optional)</label>
                  <Input
                    type="number"
                    value={adjustedPoints[proposal.id] || proposal.proposed_points}
                    onChange={(e) => setAdjustedPoints(prev => ({
                      ...prev,
                      [proposal.id]: parseInt(e.target.value) || 0
                    }))}
                    min={1}
                    max={100}
                    className="w-32"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Feedback (Optional)</label>
                  <Textarea
                    value={feedback[proposal.id] || ''}
                    onChange={(e) => setFeedback(prev => ({
                      ...prev,
                      [proposal.id]: e.target.value
                    }))}
                    placeholder="Add feedback for your child..."
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApproval(proposal.id, true)}
                    disabled={processingId === proposal.id}
                    className="flex-1"
                  >
                    {processingId === proposal.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve & Create Chore
                  </Button>
                  <Button
                    onClick={() => handleApproval(proposal.id, false)}
                    disabled={processingId === proposal.id}
                    variant="outline"
                    className="flex-1"
                  >
                    {processingId === proposal.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </>
            )}

            {proposal.parent_feedback && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Parent Feedback:</p>
                <p className="text-sm text-muted-foreground">{proposal.parent_feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}