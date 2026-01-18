-- Add archiving columns to gorjetas table
ALTER TABLE public.gorjetas 
ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS arquivado_at timestamp with time zone;

-- Create policy for artists to update their own gorjetas (for archiving)
CREATE POLICY "Artists can update their own gorjetas"
ON public.gorjetas
FOR UPDATE
USING (auth.uid() = artista_id);