
-- Drop old constraint if exists and recreate with 'rejected' status
DO $$
BEGIN
  -- Try to drop existing constraint
  ALTER TABLE public.artist_subscriptions DROP CONSTRAINT IF EXISTS artist_subscriptions_status_check;
  
  -- Add new constraint with rejected
  ALTER TABLE public.artist_subscriptions ADD CONSTRAINT artist_subscriptions_status_check 
    CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'rejected'));
END $$;
