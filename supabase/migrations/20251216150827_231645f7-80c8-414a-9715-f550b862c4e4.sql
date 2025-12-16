-- Add explicit DENY policies for anonymous users on artist_mercadopago_credentials
-- This prevents any anonymous access to sensitive payment credentials

CREATE POLICY "Deny anonymous select on credentials"
ON public.artist_mercadopago_credentials
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anonymous insert on credentials"
ON public.artist_mercadopago_credentials
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous update on credentials"
ON public.artist_mercadopago_credentials
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous delete on credentials"
ON public.artist_mercadopago_credentials
FOR DELETE
TO anon
USING (false);