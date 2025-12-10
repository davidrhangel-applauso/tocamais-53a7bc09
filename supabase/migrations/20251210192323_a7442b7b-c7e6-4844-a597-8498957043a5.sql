-- Add INSERT policy for artist_mercadopago_credentials (needed for OAuth callback upsert)
CREATE POLICY "Artists can insert their own credentials"
ON public.artist_mercadopago_credentials
FOR INSERT
WITH CHECK (auth.uid() = artist_id);

-- Also allow service role to manage credentials (for edge functions using service_role_key)
-- The upsert in OAuth callback runs with service_role_key, which bypasses RLS