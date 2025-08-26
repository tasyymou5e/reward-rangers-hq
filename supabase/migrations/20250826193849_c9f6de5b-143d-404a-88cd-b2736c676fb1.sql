-- Fix foreign key relationships for security_alerts and user_feedback tables

-- Add foreign key constraint for security_alerts.user_id -> profiles.id
ALTER TABLE public.security_alerts 
ADD CONSTRAINT security_alerts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for user_feedback.user_id -> profiles.id  
ALTER TABLE public.user_feedback 
ADD CONSTRAINT user_feedback_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for user_feedback.responded_by -> profiles.id
ALTER TABLE public.user_feedback 
ADD CONSTRAINT user_feedback_responded_by_fkey 
FOREIGN KEY (responded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;