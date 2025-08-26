-- Fix missing foreign key relationships for security_alerts and user_feedback tables
-- These are causing the database relationship errors in the console

ALTER TABLE security_alerts 
ADD CONSTRAINT fk_security_alerts_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_feedback 
ADD CONSTRAINT fk_user_feedback_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE security_alerts 
ADD CONSTRAINT fk_security_alerts_resolved_by 
FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE user_feedback 
ADD CONSTRAINT fk_user_feedback_responded_by 
FOREIGN KEY (responded_by) REFERENCES auth.users(id) ON DELETE SET NULL;