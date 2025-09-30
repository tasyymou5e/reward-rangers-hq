-- Phase 2: Performance Index Optimization
-- Fixing unindexed foreign keys, unused indexes, and backup table issues

-- ============================================
-- PART 1: Add Missing Foreign Key Indexes
-- ============================================

-- Achievement chains
CREATE INDEX IF NOT EXISTS idx_achievement_chains_parent_id 
ON achievement_chains(parent_achievement_id);

-- Admin permissions
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_granted_by 
ON admin_role_permissions(granted_by);

-- Bulk operations
CREATE INDEX IF NOT EXISTS idx_bulk_operations_initiated_by 
ON bulk_operations(initiated_by);

-- Child account settings
CREATE INDEX IF NOT EXISTS idx_child_account_settings_family_id 
ON child_account_settings(family_id);
CREATE INDEX IF NOT EXISTS idx_child_account_settings_parent_id 
ON child_account_settings(parent_id);

-- Child goal proposals
CREATE INDEX IF NOT EXISTS idx_child_goal_proposals_approved_by 
ON child_goal_proposals(approved_by);

-- Chore challenges
CREATE INDEX IF NOT EXISTS idx_chore_challenges_chore_id 
ON chore_challenges(chore_id);
CREATE INDEX IF NOT EXISTS idx_chore_challenges_participant_id 
ON chore_challenges(participant_id);

-- Chore templates
CREATE INDEX IF NOT EXISTS idx_chore_templates_created_by 
ON chore_templates(created_by);

-- Families
CREATE INDEX IF NOT EXISTS idx_families_primary_email_designator_id 
ON families(primary_email_designator_id);

-- Family email system
CREATE INDEX IF NOT EXISTS idx_family_email_designators_primary_user_id 
ON family_email_designators(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_family_email_routing_family_id 
ON family_email_routing(family_id);
CREATE INDEX IF NOT EXISTS idx_family_email_routing_target_user_id 
ON family_email_routing(target_user_id);

-- Family join requests
CREATE INDEX IF NOT EXISTS idx_family_join_requests_approved_by 
ON family_join_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_family_join_requests_family_id 
ON family_join_requests(family_id);
CREATE INDEX IF NOT EXISTS idx_family_join_requests_requester_id 
ON family_join_requests(requester_id);

-- Notification routing
CREATE INDEX IF NOT EXISTS idx_notification_routing_family_id 
ON notification_routing(family_id);
CREATE INDEX IF NOT EXISTS idx_notification_routing_recipient_user_id 
ON notification_routing(recipient_user_id);

-- Point transactions
CREATE INDEX IF NOT EXISTS idx_point_transactions_chore_id 
ON point_transactions(chore_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_goal_id 
ON point_transactions(goal_id);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_parent_email_designator 
ON profiles(parent_email_designator);

-- Rewards
CREATE INDEX IF NOT EXISTS idx_rewards_approved_by 
ON rewards(approved_by);
CREATE INDEX IF NOT EXISTS idx_rewards_created_by 
ON rewards(created_by);

-- Wishlist items
CREATE INDEX IF NOT EXISTS idx_wishlist_items_affiliate_id 
ON wishlist_items(affiliate_id);

-- ============================================
-- PART 2: Add Primary Keys to Backup Tables
-- ============================================

-- Add primary key to families_backup
ALTER TABLE families_backup 
ADD COLUMN IF NOT EXISTS backup_id uuid DEFAULT gen_random_uuid();

ALTER TABLE families_backup 
ADD PRIMARY KEY (backup_id);

-- Add primary key to profiles_backup
ALTER TABLE profiles_backup 
ADD COLUMN IF NOT EXISTS backup_id uuid DEFAULT gen_random_uuid();

ALTER TABLE profiles_backup 
ADD PRIMARY KEY (backup_id);

-- ============================================
-- PART 3: Remove Unused Indexes (Selective)
-- ============================================
-- Note: We're keeping most indexes as they may be needed when 
-- the application scales. Only removing truly redundant ones.

-- Security test results unused indexes (test table)
DROP INDEX IF EXISTS idx_security_test_results_user_id;
DROP INDEX IF EXISTS idx_security_test_results_test_id;
DROP INDEX IF EXISTS idx_security_test_results_created_at;

-- Duplicate/redundant indexes on commonly queried tables
-- (These will be recreated if needed based on actual query patterns)

COMMENT ON INDEX idx_achievement_chains_parent_id IS 'Added for foreign key performance';
COMMENT ON INDEX idx_families_primary_email_designator_id IS 'Added for foreign key performance';
COMMENT ON INDEX idx_family_email_routing_family_id IS 'Added for foreign key performance';