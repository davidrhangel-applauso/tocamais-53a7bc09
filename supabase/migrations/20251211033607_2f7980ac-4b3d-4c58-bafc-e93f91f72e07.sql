-- Drop existing policies to recreate with proper permissions
DROP POLICY IF EXISTS "Artists can insert their own credentials" ON public.artist_mercadopago_credentials;
DROP POLICY IF EXISTS "Artists can update their own credentials" ON public.artist_mercadopago_credentials;
DROP POLICY IF EXISTS "Artists can view their own credentials" ON public.artist_mercadopago_credentials;

-- Recreate policies with PERMISSIVE mode (default) for proper enforcement
-- SELECT: Artists can only view their own credentials
CREATE POLICY "Artists can view their own credentials"
ON public.artist_mercadopago_credentials
FOR SELECT
TO authenticated
USING (auth.uid() = artist_id);

-- INSERT: Artists can only insert credentials for themselves
-- This ensures malicious actors cannot inject credentials for other artists
CREATE POLICY "Artists can insert their own credentials"
ON public.artist_mercadopago_credentials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = artist_id);

-- UPDATE: Artists can only update their own credentials
-- Prevents modification of token expiration dates by others
CREATE POLICY "Artists can update their own credentials"
ON public.artist_mercadopago_credentials
FOR UPDATE
TO authenticated
USING (auth.uid() = artist_id)
WITH CHECK (auth.uid() = artist_id);

-- DELETE: Artists can delete their own credentials (to unlink account)
CREATE POLICY "Artists can delete their own credentials"
ON public.artist_mercadopago_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = artist_id);

-- Ensure no anonymous access is possible
REVOKE ALL ON public.artist_mercadopago_credentials FROM anon;