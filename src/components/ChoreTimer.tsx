import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react";

interface ChoreTimerProps {
  choreId: string;
  duration: number; // in minutes
  onComplete: () => void;
  onStop: () => void;
}

export function ChoreTimer({ choreId, duration, onComplete, onStop }: ChoreTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds
  const [isRunning, setIsRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isRunning || isCompleted) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsCompleted(true);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  const handleComplete = () => {
    setIsCompleted(true);
    setIsRunning(false);
    onComplete();
  };

  const handleReset = () => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    onStop();
  };

  return (
    <Card className="w-full bg-gradient-to-br from-kids-primary/10 to-kids-accent/10 border-kids-primary/20">
      <CardContent className="p-4 text-center space-y-4">
        <div className="text-3xl font-bold text-kids-primary">
          {formatTime(timeLeft)}
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="text-sm text-muted-foreground">
          {isCompleted ? "Time's up!" : `${formatTime(timeLeft)} remaining`}
        </div>
        
        <div className="flex gap-2 justify-center">
          {!isCompleted ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="kids"
                size="sm"
                onClick={handleComplete}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Done!
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
              >
                Stop
              </Button>
            </>
          ) : (
            <Button
              variant="kids"
              onClick={handleComplete}
              className="animate-pulse"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete! 🎉
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}