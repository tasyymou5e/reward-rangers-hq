import { useState } from "react";
import { Calendar, Clock, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useChores } from "@/hooks/useChores";
import { useChoreCalendar } from "@/hooks/useChoreCalendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChoreSelectionModalProps {
  children: React.ReactNode;
}

export function ChoreSelectionModal({ children }: ChoreSelectionModalProps) {
  const { chores } = useChores();
  const { addChoreToCalendar } = useChoreCalendar();
  const { toast } = useToast();
  const [selectedChore, setSelectedChore] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isOpen, setIsOpen] = useState(false);

  // Filter available chores (not completed)
  const availableChores = chores.filter(chore => chore.status === 'pending');

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

  const handleAddToCalendar = async () => {
    if (!selectedChore || !selectedDate) return;

    try {
      await addChoreToCalendar(selectedChore.id, format(selectedDate, 'yyyy-MM-dd'));
      toast({
        title: "Chore Added to Calendar! 📅",
        description: `${selectedChore.title} scheduled for ${format(selectedDate, 'MMM dd, yyyy')}`,
      });
      setIsOpen(false);
      setSelectedChore(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add chore to calendar",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select a Chore to Schedule</DialogTitle>
          <DialogDescription>
            Choose a chore and pick a date to add it to your calendar
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chore Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">Available Chores</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableChores.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chores available to schedule</p>
              ) : (
                availableChores.map((chore) => (
                  <Card
                    key={chore.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedChore?.id === chore.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedChore(chore)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{getChoreEmoji(chore.title)}</span>
                            <h4 className="font-medium">{chore.title}</h4>
                          </div>
                          {chore.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {chore.description}
                            </p>
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">Choose Date</h3>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
            
            {selectedChore && selectedDate && (
              <Card className="bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Selected Schedule</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getChoreEmoji(selectedChore.title)}</span>
                      <span className="font-medium">{selectedChore.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(selectedDate, 'EEEE, MMM dd, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToCalendar}
            disabled={!selectedChore || !selectedDate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}