import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Star } from "lucide-react";

interface WishlistFormProps {
  onSubmit: (data: { title: string; description: string; points_goal: number }) => void;
  isLoading?: boolean;
}

export function WishlistForm({ onSubmit, isLoading = false }: WishlistFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsGoal, setPointsGoal] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && pointsGoal > 0) {
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        points_goal: pointsGoal
      });
      setTitle('');
      setDescription('');
      setPointsGoal(50);
    }
  };

  return (
    <Card className="border-2 border-dashed border-kids-accent/30 hover:border-kids-accent/60 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-kids-accent">
          <Plus className="h-5 w-5" />
          Add New Wish
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">What do you wish for?</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New toy, extra screen time, special treat"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Tell us more (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why do you want this? Any special details?"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="points">How many XP should this cost?</Label>
            <div className="flex items-center gap-2">
              <Input
                id="points"
                type="number"
                min="1"
                max="1000"
                value={pointsGoal}
                onChange={(e) => setPointsGoal(Number(e.target.value))}
                className="w-24"
                required
              />
              <div className="flex items-center gap-1 text-kids-accent">
                <Star className="h-4 w-4" />
                XP
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Ask your parents what they think is fair!
            </p>
          </div>
          
          <Button 
            type="submit" 
            disabled={!title.trim() || pointsGoal <= 0 || isLoading}
            className="w-full"
            variant="kids"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Adding Wish...' : 'Add to Wishlist'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}