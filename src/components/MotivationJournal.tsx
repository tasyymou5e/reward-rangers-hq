import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Heart, Smile, Meh, Frown, Star, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/hooks/useFamily';
import { format } from 'date-fns';

interface JournalEntry {
  id: string;
  user_id: string;
  family_id: string;
  chore_id?: string;
  task_name: string;
  emotion: 'happy' | 'excited' | 'okay' | 'sad' | 'frustrated';
  confidence_level: number;
  reflection: string;
  what_helped?: string;
  next_time?: string;
  created_at: string;
}

interface MotivationJournalProps {
  choreId?: string;
  choreTitle?: string;
  onEntryComplete?: () => void;
}

export function MotivationJournal({ choreId, choreTitle, onEntryComplete }: MotivationJournalProps) {
  const { user } = useAuth();
  const { family } = useFamily();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New entry form state
  const [selectedEmotion, setSelectedEmotion] = useState<JournalEntry['emotion'] | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [reflection, setReflection] = useState('');
  const [whatHelped, setWhatHelped] = useState('');
  const [nextTime, setNextTime] = useState('');

  const emotions = [
    { value: 'happy', icon: '😊', label: 'Happy', color: 'bg-green-500' },
    { value: 'excited', icon: '🤩', label: 'Excited', color: 'bg-yellow-500' },
    { value: 'okay', icon: '😐', label: 'Okay', color: 'bg-blue-500' },
    { value: 'sad', icon: '😢', label: 'Sad', color: 'bg-purple-500' },
    { value: 'frustrated', icon: '😤', label: 'Frustrated', color: 'bg-red-500' },
  ] as const;

  const fetchEntries = async () => {
    if (!user || !family?.id) return;

    try {
      const { data, error } = await supabase
        .from('motivation_journal')
        .select('*')
        .eq('user_id', user.id)
        .eq('family_id', family.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    }
  };

  const saveEntry = async () => {
    if (!user || !family?.id || !selectedEmotion || !reflection.trim()) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('motivation_journal')
        .insert({
          user_id: user.id,
          family_id: family.id,
          chore_id: choreId,
          task_name: choreTitle || 'General reflection',
          emotion: selectedEmotion,
          confidence_level: confidenceLevel,
          reflection: reflection.trim(),
          what_helped: whatHelped.trim() || null,
          next_time: nextTime.trim() || null,
        });

      if (error) throw error;

      // Reset form
      setSelectedEmotion(null);
      setConfidenceLevel(3);
      setReflection('');
      setWhatHelped('');
      setNextTime('');
      
      await fetchEntries();
      setIsOpen(false);
      onEntryComplete?.();
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionData = (emotion: string) => {
    return emotions.find(e => e.value === emotion) || emotions[2];
  };

  const getEmotionStats = () => {
    const emotionCounts = entries.reduce((acc, entry) => {
      acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgConfidence = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + entry.confidence_level, 0) / entries.length 
      : 0;

    return { emotionCounts, avgConfidence };
  };

  useEffect(() => {
    if (user && family?.id) {
      fetchEntries();
    }
  }, [user, family?.id]);

  const { emotionCounts, avgConfidence } = getEmotionStats();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-kids-primary text-kids-primary hover:bg-kids-primary hover:text-white">
          <BookOpen className="h-4 w-4 mr-2" />
          My Journal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-kids-primary">
            <Heart className="h-6 w-6" />
            My Motivation Journal
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="new-entry" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new-entry">New Entry</TabsTrigger>
            <TabsTrigger value="my-entries">My Entries ({entries.length})</TabsTrigger>
            <TabsTrigger value="insights">My Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="new-entry" className="space-y-6">
            <Card className="border-kids-primary/20">
              <CardHeader>
                <CardTitle className="text-kids-primary">
                  {choreTitle ? `How did "${choreTitle}" make you feel?` : 'How are you feeling today?'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Emotion Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Pick your emotion:</label>
                  <div className="grid grid-cols-5 gap-3">
                    {emotions.map((emotion) => (
                      <Button
                        key={emotion.value}
                        variant={selectedEmotion === emotion.value ? "default" : "outline"}
                        className={`h-20 flex-col gap-2 ${
                          selectedEmotion === emotion.value 
                            ? `${emotion.color} text-white hover:opacity-90` 
                            : 'hover:border-kids-primary'
                        }`}
                        onClick={() => setSelectedEmotion(emotion.value)}
                      >
                        <span className="text-2xl">{emotion.icon}</span>
                        <span className="text-xs">{emotion.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Confidence Level */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">How confident did you feel? (1-5 stars)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => setConfidenceLevel(star)}
                      >
                        <Star 
                          className={`h-8 w-8 ${
                            star <= confidenceLevel 
                              ? 'fill-kids-accent text-kids-accent' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Reflection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Tell me about your experience:</label>
                  <Textarea
                    placeholder="What happened? How did it make you feel? What was challenging or fun?"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* What Helped */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">What helped you? (optional)</label>
                  <Textarea
                    placeholder="Did someone help you? Did you use a special strategy? What made it easier?"
                    value={whatHelped}
                    onChange={(e) => setWhatHelped(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Next Time */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">What would you do differently next time? (optional)</label>
                  <Textarea
                    placeholder="Is there something you'd like to try differently? How could it be more fun?"
                    value={nextTime}
                    onChange={(e) => setNextTime(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <Button 
                  onClick={saveEntry}
                  disabled={!selectedEmotion || !reflection.trim() || loading}
                  className="w-full bg-kids-primary hover:bg-kids-primary/90"
                >
                  {loading ? 'Saving...' : 'Save My Entry'} ❤️
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-entries" className="space-y-4">
            {entries.length === 0 ? (
              <Card className="text-center p-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-kids-primary opacity-50" />
                <p className="text-muted-foreground">No journal entries yet. Start by adding your first reflection!</p>
              </Card>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {entries.map((entry) => {
                  const emotionData = getEmotionData(entry.emotion);
                  return (
                    <Card key={entry.id} className="border-kids-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{emotionData.icon}</span>
                            <div>
                              <h4 className="font-medium text-kids-primary">{entry.task_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(entry.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: entry.confidence_level }, (_, i) => (
                              <Star key={i} className="h-4 w-4 fill-kids-accent text-kids-accent" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm mb-2">{entry.reflection}</p>
                        {entry.what_helped && (
                          <p className="text-sm text-green-600 mb-1">
                            <strong>What helped:</strong> {entry.what_helped}
                          </p>
                        )}
                        {entry.next_time && (
                          <p className="text-sm text-blue-600">
                            <strong>Next time:</strong> {entry.next_time}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-kids-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-kids-primary">
                    <Smile className="h-5 w-5" />
                    Emotion Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {emotions.map((emotion) => {
                      const count = emotionCounts[emotion.value] || 0;
                      const percentage = entries.length > 0 ? (count / entries.length) * 100 : 0;
                      return (
                        <div key={emotion.value} className="flex items-center gap-3">
                          <span className="text-xl">{emotion.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span>{emotion.label}</span>
                              <span>{count} times</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className={`h-2 rounded-full ${emotion.color}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-kids-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-kids-primary">
                    <TrendingUp className="h-5 w-5" />
                    My Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-kids-primary">
                      {avgConfidence.toFixed(1)}
                    </div>
                    <div className="flex justify-center gap-1 mb-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star 
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(avgConfidence) 
                              ? 'fill-kids-accent text-kids-accent' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Average Confidence</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Badge variant="outline" className="w-full justify-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {entries.length} Total Entries
                    </Badge>
                    {entries.length >= 5 && (
                      <Badge className="w-full justify-center bg-kids-success">
                        🏆 Reflection Champion!
                      </Badge>
                    )}
                    {avgConfidence >= 4 && (
                      <Badge className="w-full justify-center bg-kids-accent">
                        ⭐ Super Confident!
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}