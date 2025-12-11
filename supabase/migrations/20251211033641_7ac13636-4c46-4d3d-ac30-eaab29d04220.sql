-- artist_subscriptions should only be managed by the system (service role) via edge functions
-- Artists can only view their own subscriptions, not modify them directly

-- The table already has SELECT policy, ensure INSERT/UPDATE/DELETE are blocked for regular users
-- These operations should only happen via edge functions with service role

-- Verify RLS is enabled (it should be)
ALTER TABLE public.artist_subscriptions ENABLE ROW LEVEL SECURITY;

-- Revoke direct modification permissions from authenticated users
-- Subscriptions should only be created/updated via webhooks with service role
REVOKE INSERT, UPDATE, DELETE ON public.artist_subscriptions FROM authenticated;
REVOKE ALL ON public.artist_subscriptions FROM anon;