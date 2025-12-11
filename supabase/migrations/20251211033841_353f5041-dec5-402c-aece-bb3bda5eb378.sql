-- Ensure RLS blocks ALL anonymous access to credentials
-- First, verify RLS is enabled
ALTER TABLE public.artist_mercadopago_credentials ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (prevents bypassing)
ALTER TABLE public.artist_mercadopago_credentials FORCE ROW LEVEL SECURITY;

-- Explicitly revoke all permissions from anon role
REVOKE ALL PRIVILEGES ON public.artist_mercadopago_credentials FROM anon;

-- Also ensure the policies only apply to authenticated role
DROP POLICY IF EXISTS "Artists can view their own credentials" ON public.artist_mercadopago_credentials;
DROP POLICY IF EXISTS "Artists can insert their own credentials" ON public.artist_mercadopago_credentials;
DROP POLICY IF EXISTS "Artists can update their own credentials" ON public.artist_mercadopago_credentials;
DROP POLICY IF EXISTS "Artists can delete their own credentials" ON public.artist_mercadopago_credentials;

-- Recreate with explicit authenticated role requirement
CREATE POLICY "Artists can view own credentials"
ON public.artist_mercadopago_credentials
FOR SELECT
TO authenticated
USING (auth.uid() = artist_id);

CREATE POLICY "Artists can insert own credentials"
ON public.artist_mercadopago_credentials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update own credentials"
ON public.artist_mercadopago_credentials
FOR UPDATE
TO authenticated
USING (auth.uid() = artist_id)
WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can delete own credentials"
ON public.artist_mercadopago_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = artist_id);

-- For profiles: Update the public policy to exclude PIX sensitive data
-- First, drop the existing public artist policy
DROP POLICY IF EXISTS "Anyone can view artist profiles" ON public.profiles;

-- Create a new policy that only exposes non-sensitive fields
-- Note: RLS policies can't restrict columns, so we need to ensure
-- the application only queries non-sensitive columns for public access
-- The PIX data has been moved to artist_pix_info table, so we can 
-- remove those columns from profiles entirely

-- Remove PIX sensitive columns from profiles (data already migrated to artist_pix_info)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pix_chave;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pix_tipo_chave;

-- Recreate the public artist policy (now without sensitive PIX data)
CREATE POLICY "Anyone can view artist profiles"
ON public.profiles
FOR SELECT
USING (tipo = 'artista');