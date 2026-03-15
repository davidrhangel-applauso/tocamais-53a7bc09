
-- 1. Create SECURITY DEFINER function to check mostrar_gorjetas_local without triggering RLS
CREATE OR REPLACE FUNCTION public.artist_shows_tips_to_local(p_artista_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(mostrar_gorjetas_local, false)
  FROM profiles WHERE id = p_artista_id;
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Estabelecimentos podem ver gorjetas do local" ON public.gorjetas;

-- 3. Recreate using the security definer function
CREATE POLICY "Estabelecimentos podem ver gorjetas do local"
ON public.gorjetas
FOR SELECT
TO authenticated
USING (
  estabelecimento_id = auth.uid()
  AND public.artist_shows_tips_to_local(artista_id)
);
