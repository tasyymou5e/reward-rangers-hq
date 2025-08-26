-- Create enum types for user roles and chore status
CREATE TYPE public.user_role AS ENUM ('kid', 'parent', 'admin');
CREATE TYPE public.chore_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE public.reward_status AS ENUM ('available', 'redeemed', 'pending_approval');

-- Create users table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'kid',
  email TEXT NOT NULL,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create families table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create family_members junction table
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- Create chores table
CREATE TABLE public.chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_value INTEGER NOT NULL DEFAULT 10,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  assigned_to UUID REFERENCES public.profiles(id),
  status chore_status DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_time_minutes INTEGER,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create rewards table
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT DEFAULT 'general',
  status reward_status DEFAULT 'available',
  redeemed_by UUID REFERENCES public.profiles(id),
  redeemed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  points_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create progress_logs table
CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES public.chores(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'started', 'completed', 'overdue'
  points_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view family members profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm1, public.family_members fm2
      WHERE fm1.user_id = auth.uid() 
      AND fm2.user_id = public.profiles.id
      AND fm1.family_id = fm2.family_id
    )
  );

-- Families policies
CREATE POLICY "Parents can manage their families" ON public.families
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "Family members can view their family" ON public.families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = public.families.id AND user_id = auth.uid()
    )
  );

-- Family members policies
CREATE POLICY "Family members can view family membership" ON public.family_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.family_members fm2
      WHERE fm2.family_id = public.family_members.family_id AND fm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage family membership" ON public.family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.families 
      WHERE id = family_id AND parent_id = auth.uid()
    )
  );

-- Chores policies
CREATE POLICY "Family members can view family chores" ON public.chores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = public.chores.family_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage family chores" ON public.chores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.families 
      WHERE id = family_id AND parent_id = auth.uid()
    )
  );

CREATE POLICY "Kids can update assigned chores" ON public.chores
  FOR UPDATE USING (assigned_to = auth.uid());

-- Similar policies for other tables...
CREATE POLICY "Family members can view family rewards" ON public.rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = public.rewards.family_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage family rewards" ON public.rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.families 
      WHERE id = family_id AND parent_id = auth.uid()
    )
  );

-- Badges are public
CREATE POLICY "Everyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- User badges
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view family member badges" ON public.user_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm1, public.family_members fm2
      WHERE fm1.user_id = auth.uid() 
      AND fm2.user_id = public.user_badges.user_id
      AND fm1.family_id = fm2.family_id
    )
  );

-- Progress logs
CREATE POLICY "Users can view own progress" ON public.progress_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Parents can view family progress" ON public.progress_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.families 
      WHERE id = family_id AND parent_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON public.chores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some default badges
INSERT INTO public.badges (name, description, icon, points_required) VALUES
  ('First Chore', 'Complete your first chore!', '🎯', 0),
  ('Chore Master', 'Complete 10 chores', '🏆', 100),
  ('Streak Champion', 'Complete chores for 7 days in a row', '🔥', 0),
  ('Early Bird', 'Complete a chore before its due date', '🌅', 0),
  ('Team Player', 'Help with family chores', '🤝', 50);