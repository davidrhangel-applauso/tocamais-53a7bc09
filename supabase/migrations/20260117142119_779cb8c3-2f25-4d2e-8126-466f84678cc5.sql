-- Create setlists table
CREATE TABLE public.setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artista_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativa BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create setlist_musicas junction table
CREATE TABLE public.setlist_musicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  musica_id UUID NOT NULL REFERENCES public.musicas_repertorio(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(setlist_id, musica_id)
);

-- Enable RLS
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_musicas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for setlists
CREATE POLICY "Artists can view their own setlists"
ON public.setlists FOR SELECT
USING (auth.uid() = artista_id);

CREATE POLICY "Artists can insert their own setlists"
ON public.setlists FOR INSERT
WITH CHECK (auth.uid() = artista_id);

CREATE POLICY "Artists can update their own setlists"
ON public.setlists FOR UPDATE
USING (auth.uid() = artista_id);

CREATE POLICY "Artists can delete their own setlists"
ON public.setlists FOR DELETE
USING (auth.uid() = artista_id);

CREATE POLICY "Anyone can view active setlists"
ON public.setlists FOR SELECT
USING (ativa = true);

-- RLS Policies for setlist_musicas
CREATE POLICY "Artists can manage setlist_musicas via setlist ownership"
ON public.setlist_musicas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.setlists 
    WHERE id = setlist_id AND artista_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view setlist_musicas of active setlists"
ON public.setlist_musicas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.setlists 
    WHERE id = setlist_id AND ativa = true
  )
);

-- Function to ensure only one setlist is active per artist
CREATE OR REPLACE FUNCTION public.ensure_single_active_setlist()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ativa = true THEN
    UPDATE public.setlists 
    SET ativa = false 
    WHERE artista_id = NEW.artista_id 
    AND id != NEW.id 
    AND ativa = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to enforce single active setlist
CREATE TRIGGER ensure_single_active_setlist_trigger
BEFORE INSERT OR UPDATE ON public.setlists
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_active_setlist();

-- Update trigger for updated_at
CREATE TRIGGER update_setlists_updated_at
BEFORE UPDATE ON public.setlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();