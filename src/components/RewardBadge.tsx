import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Star } from "lucide-react";

interface RewardBadgeProps {
  title: string;
  description: string;
  cost: number;
  category: string;
  available: boolean;
  onRedeem?: () => void;
}

export function RewardBadge({ 
  title, 
  description, 
  cost, 
  category, 
  available,
  onRedeem 
}: RewardBadgeProps) {
  return (
    <Card className={`hover:shadow-glow hover:scale-105 transform transition-bounce ${
      available ? "bg-gradient-to-br from-kids-accent/10 to-kids-secondary/10" : "bg-muted/50"
    }`}>
      <CardContent className="p-6 text-center space-y-4">
        <div className="text-4xl animate-float">
          🎁
        </div>
        
        <div className="space-y-2">
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <Badge variant="outline">{category}</Badge>
          <div className="flex items-center gap-1 text-kids-accent font-bold">
            <Star className="h-4 w-4" />
            {cost} XP
          </div>
        </div>
        
        <Button 
          variant="reward" 
          size="sm" 
          disabled={!available}
          onClick={onRedeem}
          className="w-full"
        >
          <Gift className="h-4 w-4 mr-2" />
          {available ? "Redeem!" : "Not Enough XP"}
        </Button>
      </CardContent>
    </Card>
  );
}