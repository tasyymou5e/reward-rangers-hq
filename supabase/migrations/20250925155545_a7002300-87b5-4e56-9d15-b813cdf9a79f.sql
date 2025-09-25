-- Add 'unknown' to user_role enum to allow Supabase anonymization during deletions
DO $$
BEGIN
  -- Add the value only if it does not exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'unknown'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'unknown';
  END IF;
END$$;

-- Optional: ensure profiles.role has a valid default (keep existing 'kid')
-- No change to default needed

-- Safety: convert any stray text 'unknown' assignments to enum
-- Not needed; once enum value exists, assignments will work