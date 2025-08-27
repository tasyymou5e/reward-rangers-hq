import { Clock, CheckCircle, X, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ChoreApprovalCardProps {
  chore: any;
  onApprove: (choreId: string) => Promise<void>;
  onReject: (choreId: string) => Promise<void>;
}

export function ChoreApprovalCard({ chore, onApprove, onReject }: ChoreApprovalCardProps) {
  const { toast } = useToast();

  const handleApprove = async () => {
    try {
      await onApprove(chore.id);
      toast({
        title: "Chore Approved! ✅",
        description: `${chore.assigned_to_profile?.display_name}'s chore has been approved!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve chore",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      await onReject(chore.id);
      toast({
        title: "Chore Rejected",
        description: `${chore.assigned_to_profile?.display_name} will need to redo this chore.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject chore",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChoreEmoji = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('clean') || titleLower.includes('tidy')) return '🧹';
    if (titleLower.includes('dish') || titleLower.includes('kitchen')) return '🍽️';
    if (titleLower.includes('bed') || titleLower.includes('room')) return '🛏️';
    if (titleLower.includes('trash') || titleLower.includes('garbage')) return '🗑️';
    if (titleLower.includes('vacuum') || titleLower.includes('floor')) return '🧽';
    if (titleLower.includes('homework') || titleLower.includes('study')) return '📚';
    return '✨';
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            {getChoreEmoji(chore.title)} {chore.title}
          </CardTitle>
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending Approval
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Completed by: <strong>{chore.assigned_to_profile?.display_name}</strong></span>
        </div>

        {chore.description && (
          <p className="text-sm text-muted-foreground">{chore.description}</p>
        )}
        
        <div className="flex items-center gap-2">
          <Badge className={getDifficultyColor(chore.difficulty)}>
            {chore.difficulty}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-yellow-600">
            <Star className="h-3 w-3" />
            {chore.points_value} XP
          </div>
          {chore.estimated_time_minutes && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {chore.estimated_time_minutes}m
            </div>
          )}
        </div>

        {chore.completed_at && (
          <div className="text-xs text-muted-foreground">
            Completed: {new Date(chore.completed_at).toLocaleString()}
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleApprove}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Needs Redo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}