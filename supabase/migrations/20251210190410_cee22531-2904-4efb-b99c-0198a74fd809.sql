-- 1. Create secure table for Mercado Pago credentials
CREATE TABLE public.artist_mercadopago_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.artist_mercadopago_credentials ENABLE ROW LEVEL SECURITY;

-- 3. Create restrictive RLS policies - only artist can see their own credentials
CREATE POLICY "Artists can view their own credentials"
ON public.artist_mercadopago_credentials
FOR SELECT
USING (auth.uid() = artist_id);

CREATE POLICY "Artists can update their own credentials"
ON public.artist_mercadopago_credentials
FOR UPDATE
USING (auth.uid() = artist_id);

-- 4. Migrate existing data from profiles to new table
INSERT INTO public.artist_mercadopago_credentials (artist_id, seller_id, access_token, refresh_token, token_expires_at)
SELECT 
  id,
  mercadopago_seller_id,
  mercadopago_access_token,
  mercadopago_refresh_token,
  mercadopago_token_expires_at
FROM public.profiles
WHERE mercadopago_seller_id IS NOT NULL OR mercadopago_access_token IS NOT NULL;

-- 5. Create security definer function to check if artist has MP linked (for public use without exposing tokens)
CREATE OR REPLACE FUNCTION public.has_mercadopago_linked(artist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM artist_mercadopago_credentials 
    WHERE artist_mercadopago_credentials.artist_id = has_mercadopago_linked.artist_id 
    AND access_token IS NOT NULL
  );
$$;

-- 6. Create security definer function to get seller_id for payment processing (edge functions only)
CREATE OR REPLACE FUNCTION public.get_artist_mercadopago_seller_id(p_artist_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT seller_id 
  FROM artist_mercadopago_credentials 
  WHERE artist_id = p_artist_id;
$$;

-- 7. Remove sensitive columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS mercadopago_access_token,
DROP COLUMN IF EXISTS mercadopago_refresh_token,
DROP COLUMN IF EXISTS mercadopago_token_expires_at,
DROP COLUMN IF EXISTS mercadopago_seller_id;

-- 8. Add trigger for updated_at
CREATE TRIGGER update_artist_mercadopago_credentials_updated_at
BEFORE UPDATE ON public.artist_mercadopago_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();