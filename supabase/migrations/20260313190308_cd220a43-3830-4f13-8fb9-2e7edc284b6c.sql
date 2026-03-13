
-- Add estabelecimento_id to gorjetas to track tips from venues
ALTER TABLE public.gorjetas ADD COLUMN IF NOT EXISTS estabelecimento_id uuid;

-- Add mostrar_gorjetas_local to profiles for artist privacy control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mostrar_gorjetas_local boolean DEFAULT false;

-- RLS: Estabelecimento can view gorjetas linked to their venue (if artist allows)
CREATE POLICY "Estabelecimentos podem ver gorjetas do local"
ON public.gorjetas
FOR SELECT
TO authenticated
USING (
  estabelecimento_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = gorjetas.artista_id
    AND profiles.mostrar_gorjetas_local = true
  )
);
