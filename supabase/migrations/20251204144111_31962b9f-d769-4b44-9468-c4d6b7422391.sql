-- Add plano enum type
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');

-- Add plano column to profiles
ALTER TABLE public.profiles 
ADD COLUMN plano subscription_plan NOT NULL DEFAULT 'free';

-- Create artist_subscriptions table
CREATE TABLE public.artist_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artista_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  payment_id TEXT,
  subscription_id TEXT,
  valor NUMERIC NOT NULL DEFAULT 39.90,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for artist_subscriptions
CREATE POLICY "Artists can view their own subscriptions"
ON public.artist_subscriptions
FOR SELECT
USING (auth.uid() = artista_id);

-- Create function to check if artist is Pro with active subscription
CREATE OR REPLACE FUNCTION public.is_artist_pro(artist_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    LEFT JOIN artist_subscriptions s ON s.artista_id = p.id AND s.status = 'active'
    WHERE p.id = artist_id 
    AND p.plano = 'pro'
    AND (s.ends_at IS NULL OR s.ends_at > now())
  );
$$;

-- Create function to get artist plan fee (returns 0.20 for free, 0 for pro)
CREATE OR REPLACE FUNCTION public.get_artist_platform_fee(artist_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.is_artist_pro(artist_id) THEN 0.00
    ELSE 0.20
  END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_artist_subscriptions_updated_at
BEFORE UPDATE ON public.artist_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_artist_subscriptions_artista_status ON public.artist_subscriptions(artista_id, status);