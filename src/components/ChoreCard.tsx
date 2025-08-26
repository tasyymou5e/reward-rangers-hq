import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, CheckCircle } from "lucide-react";

interface ChoreCardProps {
  title: string;
  description: string;
  points: number;
  timeEstimate: string;
  difficulty: "easy" | "medium" | "hard";
  isCompleted?: boolean;
  onComplete?: () => void;
}

export function ChoreCard({ 
  title, 
  description, 
  points, 
  timeEstimate, 
  difficulty, 
  isCompleted = false,
  onComplete 
}: ChoreCardProps) {
  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy": return "bg-kids-success";
      case "medium": return "bg-kids-accent";
      case "hard": return "bg-kids-primary";
    }
  };

  const getDifficultyEmoji = () => {
    switch (difficulty) {
      case "easy": return "😊";
      case "medium": return "🤔";
      case "hard": return "💪";
    }
  };

  return (
    <Card className={`hover:shadow-kids hover:scale-105 transform transition-bounce ${
      isCompleted ? "bg-kids-success/10 border-kids-success" : "bg-white"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            {getDifficultyEmoji()} {title}
          </CardTitle>
          <Badge className={`${getDifficultyColor()} text-white`}>
            {difficulty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{description}</p>
        
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {timeEstimate}
          </div>
          <div className="flex items-center gap-1 text-kids-accent font-bold">
            <Star className="h-4 w-4" />
            {points} XP
          </div>
        </div>
        
        {isCompleted ? (
          <Button variant="chore" disabled className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed! 🎉
          </Button>
        ) : (
          <Button variant="chore" onClick={onComplete} className="w-full">
            Complete Chore
          </Button>
        )}
      </CardContent>
    </Card>
  );
}