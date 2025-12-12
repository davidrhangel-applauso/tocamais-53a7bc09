-- Add explicit policies to deny public/anonymous access to artist_subscriptions
-- This table contains sensitive payment and subscription data

CREATE POLICY "Deny anonymous access to subscriptions"
ON public.artist_subscriptions
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anonymous insert to subscriptions"
ON public.artist_subscriptions
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous update to subscriptions"
ON public.artist_subscriptions
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous delete to subscriptions"
ON public.artist_subscriptions
FOR DELETE
TO anon
USING (false);