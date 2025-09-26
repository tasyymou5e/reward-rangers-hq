-- Create chore_templates table for admin-managed default chores
CREATE TABLE public.chore_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  points_value integer NOT NULL DEFAULT 10,
  estimated_time_minutes integer,
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text NOT NULL DEFAULT 'general',
  autism_friendly boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chore_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can manage chore templates" 
ON public.chore_templates 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Family members can view active templates
CREATE POLICY "Family members can view active templates" 
ON public.chore_templates 
FOR SELECT 
USING (is_active = true AND EXISTS (
  SELECT 1 FROM family_members WHERE user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_chore_templates_updated_at
  BEFORE UPDATE ON public.chore_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default templates
INSERT INTO public.chore_templates (title, description, points_value, estimated_time_minutes, difficulty, category, autism_friendly) VALUES
('Make your bed', 'Straighten sheets, arrange pillows, and tidy bedroom', 10, 5, 'easy', 'bedroom', true),
('Clean your room', 'Organize toys, clothes, and personal items', 20, 15, 'medium', 'bedroom', true),
('Take out trash', 'Empty wastebaskets and take bags to collection area', 15, 10, 'easy', 'general', false),
('Feed pets', 'Give food and fresh water to family pets', 10, 5, 'easy', 'pets', true),
('Water plants', 'Check and water indoor or outdoor plants', 10, 10, 'easy', 'outdoor', true),
('Load dishwasher', 'Place dirty dishes in dishwasher properly', 15, 10, 'medium', 'kitchen', false),
('Wipe down counters', 'Clean kitchen and bathroom countertops', 10, 8, 'easy', 'kitchen', true),
('Vacuum living room', 'Vacuum carpets and rugs in main living areas', 25, 20, 'medium', 'living-room', false),
('Organize bookshelf', 'Arrange books and items neatly on shelves', 15, 15, 'easy', 'living-room', true),
('Clean bathroom mirror', 'Wipe and polish bathroom mirrors', 10, 5, 'easy', 'bathroom', true),
('Sort recycling', 'Separate recyclable items properly', 15, 10, 'medium', 'general', true),
('Sweep porch/patio', 'Clean outdoor entrance areas', 15, 10, 'easy', 'outdoor', false);