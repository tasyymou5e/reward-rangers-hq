-- Create motivation journal table for emotional intelligence tracking
CREATE TABLE IF NOT EXISTS public.motivation_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL,
  chore_id UUID,
  task_name TEXT NOT NULL,
  emotion TEXT NOT NULL CHECK (emotion IN ('happy', 'excited', 'okay', 'sad', 'frustrated')),
  confidence_level INTEGER NOT NULL CHECK (confidence_level BETWEEN 1 AND 5),
  reflection TEXT NOT NULL,
  what_helped TEXT,
  next_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for motivation journal
ALTER TABLE public.motivation_journal ENABLE ROW LEVEL SECURITY;

-- Create policies for motivation journal
CREATE POLICY "Users can view their own journal entries"
ON public.motivation_journal
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries"
ON public.motivation_journal
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
ON public.motivation_journal
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Parents can view family journal entries"
ON public.motivation_journal
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM families f 
    WHERE f.id = motivation_journal.family_id 
    AND f.parent_id = auth.uid()
  )
);

-- Add trigger for timestamp updates
CREATE TRIGGER update_motivation_journal_updated_at
BEFORE UPDATE ON public.motivation_journal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();