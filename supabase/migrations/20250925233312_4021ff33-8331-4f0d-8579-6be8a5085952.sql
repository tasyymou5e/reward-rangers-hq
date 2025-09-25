-- Advanced Features Database Schema Extensions

-- Achievement Chains for Progressive Achievements
CREATE TABLE IF NOT EXISTS public.achievement_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  chain_order INTEGER NOT NULL,
  parent_achievement_id UUID REFERENCES public.badges(id),
  unlock_condition JSONB NOT NULL DEFAULT '{}',
  reward_multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Family Competitions and Challenges
CREATE TABLE IF NOT EXISTS public.family_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  competition_type TEXT NOT NULL DEFAULT 'weekly', -- weekly, monthly, seasonal, custom
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
  rules JSONB NOT NULL DEFAULT '{}',
  rewards JSONB NOT NULL DEFAULT '{}',
  leaderboard JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Push Notification Subscriptions for PWA
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Offline Action Queue for PWA
CREATE TABLE IF NOT EXISTS public.offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending', -- pending, synced, failed
  retry_count INTEGER DEFAULT 0,
  last_retry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Behavioral Analytics for Advanced Insights
CREATE TABLE IF NOT EXISTS public.behavioral_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- completion_time, difficulty_preference, motivation_trigger, etc.
  pattern_data JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT 0.0,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Predictive Insights Cache
CREATE TABLE IF NOT EXISTS public.predictive_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL,
  family_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- completion_prediction, difficulty_suggestion, burnout_warning
  insight_data JSONB NOT NULL,
  confidence_level NUMERIC NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acted_upon BOOLEAN DEFAULT false
);

-- RLS Policies for new tables
ALTER TABLE public.achievement_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_insights ENABLE ROW LEVEL SECURITY;

-- Achievement Chains Policies
CREATE POLICY "Everyone can view achievement chains" 
ON public.achievement_chains FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage achievement chains" 
ON public.achievement_chains FOR ALL 
USING (is_admin());

-- Family Competitions Policies
CREATE POLICY "Family members can view competitions" 
ON public.family_competitions FOR SELECT 
USING (is_family_member(family_id, auth.uid()));

CREATE POLICY "Family parents can manage competitions" 
ON public.family_competitions FOR ALL 
USING (is_family_parent(family_id, auth.uid()) OR is_admin());

-- Push Subscriptions Policies
CREATE POLICY "Users can manage their own push subscriptions" 
ON public.push_subscriptions FOR ALL 
USING (auth.uid() = user_id);

-- Offline Sync Queue Policies
CREATE POLICY "Users can manage their own sync queue" 
ON public.offline_sync_queue FOR ALL 
USING (auth.uid() = user_id);

-- Behavioral Patterns Policies
CREATE POLICY "Users can view their own patterns" 
ON public.behavioral_patterns FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Family parents can view family patterns" 
ON public.behavioral_patterns FOR SELECT 
USING (is_family_parent(family_id, auth.uid()));

CREATE POLICY "System can manage behavioral patterns" 
ON public.behavioral_patterns FOR ALL 
USING (true);

-- Predictive Insights Policies
CREATE POLICY "Users can view insights about themselves" 
ON public.predictive_insights FOR SELECT 
USING (auth.uid() = target_user_id);

CREATE POLICY "Family parents can view family insights" 
ON public.predictive_insights FOR SELECT 
USING (is_family_parent(family_id, auth.uid()));

CREATE POLICY "System can manage predictive insights" 
ON public.predictive_insights FOR ALL 
USING (true);

-- Functions for advanced features
CREATE OR REPLACE FUNCTION public.generate_achievement_chain_progress(user_id_param UUID, chain_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  chain_achievements RECORD;
  user_progress INTEGER := 0;
  total_achievements INTEGER := 0;
BEGIN
  -- Get all achievements in the chain
  SELECT COUNT(*) INTO total_achievements
  FROM public.achievement_chains
  WHERE id = chain_id_param OR parent_achievement_id IN (
    SELECT id FROM public.achievement_chains WHERE id = chain_id_param
  );
  
  -- Count user's completed achievements in this chain
  SELECT COUNT(*) INTO user_progress
  FROM public.user_badges ub
  JOIN public.achievement_chains ac ON ub.badge_id::text = ac.id::text
  WHERE ub.user_id = user_id_param
    AND (ac.id = chain_id_param OR ac.parent_achievement_id = chain_id_param);
  
  result := jsonb_build_object(
    'chain_id', chain_id_param,
    'progress', user_progress,
    'total', total_achievements,
    'percentage', CASE WHEN total_achievements > 0 THEN (user_progress::FLOAT / total_achievements * 100) ELSE 0 END
  );
  
  RETURN result;
END;
$$;

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_achievement_chains_updated_at
  BEFORE UPDATE ON public.achievement_chains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_competitions_updated_at
  BEFORE UPDATE ON public.family_competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();