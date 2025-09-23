import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/hooks/useFamily';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Target, Star, Book, Activity, Music, Palette } from 'lucide-react';

const goalCategories = [
  { id: 'academic', name: 'Academic', icon: Book, examples: 'Reading, Math practice, Science projects' },
  { id: 'physical', name: 'Physical Activity', icon: Activity, examples: 'Exercise, Sports, Dance' },
  { id: 'creative', name: 'Creative Arts', icon: Palette, examples: 'Drawing, Crafts, Building' },
  { id: 'music', name: 'Music & Performance', icon: Music, examples: 'Singing, Instruments, Theater' },
  { id: 'social', name: 'Social Skills', icon: Star, examples: 'Helping others, Making friends' },
  { id: 'personal', name: 'Personal Development', icon: Target, examples: 'Organization, Self-care, Mindfulness' }
];

const pointSuggestions = {
  easy: { min: 5, max: 15, description: 'Simple tasks (5-15 minutes)' },
  medium: { min: 10, max: 30, description: 'Moderate effort (15-30 minutes)' },
  hard: { min: 20, max: 50, description: 'Challenging tasks (30+ minutes)' }
};

export default function ChildGoalProposal() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    proposedPoints: 10
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !family) {
      toast.error('Please ensure you\'re logged in and part of a family');
      return;
    }

    if (!formData.title.trim() || !formData.category || !formData.difficulty) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('child_goal_proposals')
        .insert({
          child_id: user.id,
          family_id: family.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          proposed_points: formData.proposedPoints,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Goal proposal submitted! Your parent will review it soon.');
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty: '',
        proposedPoints: 10
      });
    } catch (error) {
      console.error('Error submitting goal proposal:', error);
      toast.error('Failed to submit goal proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDifficultyChange = (difficulty: string) => {
    setFormData(prev => {
      const suggestion = pointSuggestions[difficulty as keyof typeof pointSuggestions];
      return {
        ...prev,
        difficulty,
        proposedPoints: suggestion ? suggestion.min : prev.proposedPoints
      };
    });
  };

  const selectedCategory = goalCategories.find(cat => cat.id === formData.category);
  const selectedDifficulty = pointSuggestions[formData.difficulty as keyof typeof pointSuggestions];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Propose a New Goal
        </CardTitle>
        <CardDescription>
          Create a personal goal and earn points when you complete it!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Goal Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What do you want to accomplish?"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category *
            </label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {goalCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {category.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-sm text-muted-foreground">
                Examples: {selectedCategory.examples}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="difficulty" className="text-sm font-medium">
              Difficulty Level *
            </label>
            <Select 
              value={formData.difficulty} 
              onValueChange={handleDifficultyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="How challenging is this goal?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - {pointSuggestions.easy.description}</SelectItem>
                <SelectItem value="medium">Medium - {pointSuggestions.medium.description}</SelectItem>
                <SelectItem value="hard">Hard - {pointSuggestions.hard.description}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="points" className="text-sm font-medium">
              Proposed Points
            </label>
            <Input
              id="points"
              type="number"
              value={formData.proposedPoints}
              onChange={(e) => setFormData(prev => ({ ...prev, proposedPoints: parseInt(e.target.value) || 0 }))}
              min={1}
              max={100}
            />
            {selectedDifficulty && (
              <p className="text-sm text-muted-foreground">
                Suggested range: {selectedDifficulty.min}-{selectedDifficulty.max} points
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your goal in more detail..."
              maxLength={500}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Goal Proposal'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}