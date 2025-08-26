-- Add MFA and security enhancements
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  backup_codes TEXT[],
  totp_secret TEXT,
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for MFA settings
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own MFA settings"
ON public.user_mfa_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA settings"
ON public.user_mfa_settings
FOR ALL
USING (auth.uid() = user_id);

-- Add family chat/notes table
CREATE TABLE IF NOT EXISTS public.family_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'note', 'announcement')),
  content TEXT NOT NULL,
  chore_id UUID,
  parent_message_id UUID,
  is_encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for family messages
ALTER TABLE public.family_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view family messages"
ON public.family_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.family_id = public.family_messages.family_id 
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can create messages"
ON public.family_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.family_id = public.family_messages.family_id 
    AND fm.user_id = auth.uid()
  )
);

-- Add AI analytics preferences table
CREATE TABLE IF NOT EXISTS public.family_ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL UNIQUE,
  ai_suggestions_enabled BOOLEAN DEFAULT true,
  analytics_enabled BOOLEAN DEFAULT true,
  data_sharing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for AI settings
ALTER TABLE public.family_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family parents can manage AI settings"
ON public.family_ai_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM families f 
    WHERE f.id = public.family_ai_settings.family_id 
    AND f.parent_id = auth.uid()
  )
);

-- Add chore completion analytics table for AI insights
CREATE TABLE IF NOT EXISTS public.chore_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  child_id UUID NOT NULL,
  chore_id UUID NOT NULL,
  completion_time INTEGER, -- seconds taken to complete
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  preferred_time_of_day TEXT,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for chore analytics
ALTER TABLE public.chore_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view analytics"
ON public.chore_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.family_id = public.chore_analytics.family_id 
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert analytics"
ON public.chore_analytics
FOR INSERT
WITH CHECK (true);

-- Add weekly report generation table
CREATE TABLE IF NOT EXISTS public.family_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  generated_by UUID NOT NULL,
  report_type TEXT DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'monthly', 'custom')),
  report_data JSONB NOT NULL,
  report_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for family reports
ALTER TABLE public.family_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family parents can manage reports"
ON public.family_reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM families f 
    WHERE f.id = public.family_reports.family_id 
    AND f.parent_id = auth.uid()
  )
);

-- Create triggers for timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_mfa_settings_updated_at
BEFORE UPDATE ON public.user_mfa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_messages_updated_at
BEFORE UPDATE ON public.family_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_ai_settings_updated_at
BEFORE UPDATE ON public.family_ai_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();