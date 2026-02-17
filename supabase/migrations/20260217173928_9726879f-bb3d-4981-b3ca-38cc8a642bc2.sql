
CREATE OR REPLACE FUNCTION public.get_artist_approved_total(artist_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(valor_liquido_artista), 0)
  FROM gorjetas
  WHERE gorjetas.artista_id = get_artist_approved_total.artist_id
    AND status_pagamento = 'approved';
$$;
