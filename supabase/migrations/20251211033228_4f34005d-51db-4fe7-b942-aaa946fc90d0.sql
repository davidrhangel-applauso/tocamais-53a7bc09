-- Create a separate table for sensitive PIX data (pix_chave is sensitive as it can be CPF/phone/email)
CREATE TABLE public.artist_pix_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pix_chave TEXT,
  pix_tipo_chave TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_pix_info ENABLE ROW LEVEL SECURITY;

-- Only the artist can view/manage their own PIX info
CREATE POLICY "Artists can view their own PIX info"
ON public.artist_pix_info FOR SELECT
USING (auth.uid() = artist_id);

CREATE POLICY "Artists can insert their own PIX info"
ON public.artist_pix_info FOR INSERT
WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update their own PIX info"
ON public.artist_pix_info FOR UPDATE
USING (auth.uid() = artist_id);

-- Migrate existing PIX data from profiles to new table
INSERT INTO public.artist_pix_info (artist_id, pix_chave, pix_tipo_chave)
SELECT id, pix_chave, pix_tipo_chave
FROM public.profiles
WHERE pix_chave IS NOT NULL OR pix_tipo_chave IS NOT NULL
ON CONFLICT (artist_id) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_artist_pix_info_updated_at
BEFORE UPDATE ON public.artist_pix_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get PIX info securely (for edge functions)
CREATE OR REPLACE FUNCTION public.get_artist_pix_info(p_artist_id UUID)
RETURNS TABLE(pix_chave TEXT, pix_tipo_chave TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pix_chave, pix_tipo_chave
  FROM artist_pix_info
  WHERE artist_id = p_artist_id;
$$;