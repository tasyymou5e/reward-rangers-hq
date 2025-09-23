-- Phase 1: Core Infrastructure Database Migrations

-- Child goal proposals table
CREATE TABLE public.child_goal_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) <= 100),
  description TEXT CHECK (length(description) <= 500),
  proposed_points INTEGER NOT NULL CHECK (proposed_points >= 1 AND proposed_points <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  parent_feedback TEXT CHECK (length(parent_feedback) <= 300),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhanced chore tracking
ALTER TABLE public.chores 
ADD COLUMN IF NOT EXISTS completion_time_seconds INTEGER CHECK (completion_time_seconds > 0),
ADD COLUMN IF NOT EXISTS early_completion_bonus INTEGER DEFAULT 0 CHECK (early_completion_bonus >= 0),
ADD COLUMN IF NOT EXISTS streak_bonus INTEGER DEFAULT 0 CHECK (streak_bonus >= 0),
ADD COLUMN IF NOT EXISTS speed_bonus INTEGER DEFAULT 0 CHECK (speed_bonus >= 0),
ADD COLUMN IF NOT EXISTS team_bonus INTEGER DEFAULT 0 CHECK (team_bonus >= 0),
ADD COLUMN IF NOT EXISTS challenge_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fastest_completion_time INTEGER CHECK (fastest_completion_time > 0);

-- Family leaderboards table
CREATE TABLE public.family_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  age_group TEXT NOT NULL CHECK (age_group IN ('3-5', '6-10', '11-15')),
  period_type TEXT NOT NULL DEFAULT 'weekly' CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rankings JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(family_id, age_group, period_start, period_type)
);

-- Scheduled notifications table
CREATE TABLE public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES public.chores(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'deadline', 'congratulations', 'challenge')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Point transactions table for audit trail
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES public.chores(id),
  goal_id UUID REFERENCES public.child_goal_proposals(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'penalty')),
  points_amount INTEGER NOT NULL,
  bonus_type TEXT CHECK (bonus_type IN ('early_completion', 'streak', 'speed', 'team')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Age profiles for UI customization
CREATE TABLE public.age_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  birth_date DATE,
  age_group TEXT NOT NULL CHECK (age_group IN ('3-5', '6-10', '11-15')),
  ui_complexity TEXT NOT NULL DEFAULT 'moderate' CHECK (ui_complexity IN ('simple', 'moderate', 'advanced')),
  point_limits JSONB NOT NULL DEFAULT '{"min": 1, "max": 50}',
  enabled_features JSONB NOT NULL DEFAULT '[]',
  parent_restrictions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Challenge tracking table
CREATE TABLE public.chore_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID NOT NULL REFERENCES public.chores(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  completion_time_seconds INTEGER CHECK (completion_time_seconds > 0),
  rank_in_family INTEGER CHECK (rank_in_family > 0),
  points_earned INTEGER NOT NULL DEFAULT 0,
  challenge_type TEXT NOT NULL DEFAULT 'speed' CHECK (challenge_type IN ('speed', 'accuracy', 'team')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bonus rewards tracking
CREATE TABLE public.bonus_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL CHECK (bonus_type IN ('daily_streak', 'weekly_champion', 'perfect_month', 'speed_demon', 'team_player')),
  points_awarded INTEGER NOT NULL CHECK (points_awarded > 0),
  streak_count INTEGER DEFAULT 0,
  achievement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.child_goal_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chore_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_rewards ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_child_goal_proposals_child_id ON public.child_goal_proposals(child_id);
CREATE INDEX idx_child_goal_proposals_family_id ON public.child_goal_proposals(family_id);
CREATE INDEX idx_child_goal_proposals_status ON public.child_goal_proposals(status);
CREATE INDEX idx_family_leaderboards_family_age ON public.family_leaderboards(family_id, age_group);
CREATE INDEX idx_scheduled_notifications_user_scheduled ON public.scheduled_notifications(user_id, scheduled_for);
CREATE INDEX idx_point_transactions_user_date ON public.point_transactions(user_id, created_at DESC);
CREATE INDEX idx_chore_challenges_family_date ON public.chore_challenges(family_id, created_at DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_child_goal_proposals_updated_at
  BEFORE UPDATE ON public.child_goal_proposals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_family_leaderboards_updated_at
  BEFORE UPDATE ON public.family_leaderboards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_age_profiles_updated_at
  BEFORE UPDATE ON public.age_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();