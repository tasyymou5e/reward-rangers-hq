-- Add custom_url field to approved_affiliates table
ALTER TABLE public.approved_affiliates 
ADD COLUMN custom_url text;