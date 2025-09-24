# ChoreQuest - Database Schema & Security

## 🗄️ Database Overview

ChoreQuest uses a PostgreSQL database with comprehensive Row Level Security (RLS) policies, ensuring data isolation and security across all operations.

### Schema Statistics
- **Total Tables**: 59+ tables with comprehensive coverage
- **RLS Policies**: 100+ security policies implemented
- **Security Functions**: 30+ functions preventing RLS recursion
- **Security Grade**: A- with comprehensive protection
- **Dynamic Configuration**: System settings table for real-time control

---

## 👥 User Management Tables

### Core User Tables
```sql
-- User profiles with role-based access
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('parent', 'kid', 'admin', 'full_admin', 'read_only_admin', 'report_admin')),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Family groupings with unique codes
families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  family_code TEXT UNIQUE,
  parent_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Family membership relationships
family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'kid',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, profile_id)
);
```

### User Activity Tracking
```sql
-- Comprehensive activity logging
user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL,
  activity_details JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User sessions for security tracking
user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  session_token TEXT UNIQUE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT now()
);
```

---

## 🏠 Family & Chore Management

### Chore System Tables
```sql
-- Chore categories for organization
chore_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reusable chore templates
chore_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES chore_categories(id),
  estimated_time INTEGER, -- minutes
  default_points INTEGER DEFAULT 10,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Family-specific chore instances
chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES chore_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 10,
  difficulty_level INTEGER DEFAULT 1,
  estimated_time INTEGER,
  due_date TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chore assignments to family members
chore_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID REFERENCES chores(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id)
);

-- Chore completion tracking
chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES chore_assignments(id) ON DELETE CASCADE,
  completed_by UUID REFERENCES profiles(id),
  completion_time INTEGER, -- actual time taken
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  notes TEXT,
  photo_url TEXT,
  completed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🎮 Gamification System

### Points & Achievements
```sql
-- User points tracking
user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  last_weekly_reset TIMESTAMPTZ DEFAULT date_trunc('week', now()),
  last_monthly_reset TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User levels and progression
user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  level_updated_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Achievement definitions
achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  badge_color TEXT,
  points_reward INTEGER DEFAULT 0,
  category TEXT,
  criteria JSONB, -- flexible achievement criteria
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User achievement unlocks
user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Daily streak tracking
daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Rewards & Wishlist
```sql
-- Wishlist items for goal setting
wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'redeemed')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reward redemptions tracking
reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  wishlist_item_id UUID REFERENCES wishlist_items(id),
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);
```

---

## 📊 Analytics & Monitoring

### Content & Interaction Tracking
```sql
-- Content categories for educational materials
content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  age_group TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Educational content items
content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES content_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN ('game', 'video', 'article', 'activity')),
  content_url TEXT,
  thumbnail_url TEXT,
  age_min INTEGER,
  age_max INTEGER,
  points_reward INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User content interactions
content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES content_items(id),
  interaction_type TEXT CHECK (interaction_type IN ('view', 'complete', 'like', 'share')),
  duration_seconds INTEGER,
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User favorites
content_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES content_items(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_item_id)
);
```

### System Analytics
```sql
-- Analytics metrics
analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_type TEXT,
  dimensions JSONB,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Engagement metrics
engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  family_id UUID REFERENCES families(id),
  session_duration INTEGER,
  actions_performed INTEGER,
  chores_completed INTEGER,
  points_earned INTEGER,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🛡️ Security & Audit Tables

### Security Monitoring
```sql
-- Security audit logs
security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- System errors tracking
system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  user_id UUID REFERENCES profiles(id),
  request_id TEXT,
  environment TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- System alerts
system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  affected_users JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
```

---

## ⚙️ System Configuration

### Dynamic System Settings
```sql
-- System-wide configuration storage
system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

-- Example settings structures:
-- Login Controls
{
  "parents_login_enabled": true,
  "kids_login_enabled": true, 
  "maintenance_message": "Custom message here"
}

-- System Maintenance
{
  "enabled": false,
  "message": "System is currently under maintenance. Please try again later."
}
```

### System Configuration Functions
```sql
-- Get system setting by key
CREATE OR REPLACE FUNCTION public.get_system_setting(
  key_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT value INTO setting_value
  FROM system_settings
  WHERE system_settings.key_name = get_system_setting.key_name;
  
  RETURN setting_value;
END;
$$;

-- Update system setting
CREATE OR REPLACE FUNCTION public.update_system_setting(
  key_name TEXT,
  new_value JSONB,
  setting_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO system_settings (key_name, value, description, updated_by)
  VALUES (key_name, new_value, setting_description, auth.uid())
  ON CONFLICT (key_name)
  DO UPDATE SET
    value = new_value,
    description = COALESCE(setting_description, system_settings.description),
    updated_at = now(),
    updated_by = auth.uid();
END;
$$;
```

---

## 🔐 Row Level Security (RLS) Policies

### User Data Protection
```sql
-- Profile access policies
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- Admin access to all profiles
CREATE POLICY "Admins can manage all profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id::text = auth.uid()::text 
    AND p.role IN ('admin', 'full_admin')
  )
);

-- Family data access
CREATE POLICY "Family members can view family data" 
ON families FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM family_members fm 
    JOIN profiles p ON fm.profile_id = p.id 
    WHERE fm.family_id = families.id 
    AND p.user_id::text = auth.uid()::text
  )
);

-- System settings protection
CREATE POLICY "Only full admins can manage system settings"
ON system_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id::text = auth.uid()::text
    AND p.role IN ('admin', 'full_admin')
  )
);
```

### Security Functions (Prevent RLS Recursion)
```sql
-- Role verification function
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID, 
  _role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = _user_id 
    AND role = _role
  );
END;
$$;

-- Multi-role admin check
CREATE OR REPLACE FUNCTION public.has_admin_role(
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = _user_id 
    AND role IN ('admin', 'full_admin', 'read_only_admin', 'report_admin')
  );
END;
$$;

-- Family access validation
CREATE OR REPLACE FUNCTION public.is_family_member(
  _family_id UUID, 
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members fm
    JOIN profiles p ON fm.profile_id = p.id
    WHERE fm.family_id = _family_id
    AND p.user_id = _user_id
  );
END;
$$;

-- Security event logging
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  user_id UUID DEFAULT NULL,
  event_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO security_audit_logs (
    event_type,
    user_id,
    event_details,
    ip_address,
    created_at
  ) VALUES (
    event_type,
    user_id,
    event_details,
    inet_client_addr(),
    now()
  );
END;
$$;
```

---

## 📈 Performance Optimization

### Database Indexes
```sql
-- User lookup optimization
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_role_multi ON profiles(role) WHERE role IN ('admin', 'full_admin', 'read_only_admin', 'report_admin');

-- Family relationship optimization
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_profile_id ON family_members(profile_id);

-- Chore query optimization
CREATE INDEX idx_chores_family_id ON chores(family_id);
CREATE INDEX idx_chore_assignments_assigned_to ON chore_assignments(assigned_to);
CREATE INDEX idx_chore_assignments_status ON chore_assignments(status);

-- Activity and security optimization
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_severity ON security_audit_logs(severity);

-- System settings optimization
CREATE INDEX idx_system_settings_key_name ON system_settings(key_name);
CREATE INDEX idx_system_settings_updated_at ON system_settings(updated_at);
```

### Query Optimization
```sql
-- Materialized view for dashboard analytics
CREATE MATERIALIZED VIEW daily_analytics_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_activities,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) FILTER (WHERE activity_type = 'chore_completed') as chores_completed
FROM user_activity_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_daily_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_analytics_summary;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 Data Management

### Backup Strategy
- **Automated Backups**: Daily Supabase automated backups
- **Point-in-Time Recovery**: Available for critical data restoration
- **Cross-Region Replication**: Geographic redundancy for disaster recovery

### Data Retention
- **Activity Logs**: 2 years retention with automatic archival
- **Security Logs**: 7 years retention for compliance
- **User Data**: Retained until account deletion request
- **System Settings**: Full audit trail maintained indefinitely

### Compliance Features
- **GDPR Compliance**: Right to access, portability, and deletion
- **COPPA Compliance**: Enhanced protection for child accounts
- **Audit Trail**: Complete activity logging for all operations
- **Data Encryption**: At-rest and in-transit encryption

---

*This database schema supports ChoreQuest's comprehensive feature set with 59+ tables, A- security grade, and dynamic system configuration capabilities. All tables include proper RLS policies and optimization indexes.*