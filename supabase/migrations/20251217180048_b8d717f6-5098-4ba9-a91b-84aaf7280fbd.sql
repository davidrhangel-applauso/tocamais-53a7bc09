-- Fix search_path for calculate_distance function
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION := 6371;
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Fix search_path for get_nearby_live_artists function
CREATE OR REPLACE FUNCTION public.get_nearby_live_artists(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  foto_url TEXT,
  cidade TEXT,
  estilo_musical public.music_style,
  bio TEXT,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.foto_url,
    p.cidade,
    p.estilo_musical,
    p.bio,
    public.calculate_distance(user_lat, user_lon, p.latitude, p.longitude) AS distance_km
  FROM public.profiles p
  WHERE p.tipo = 'artista'
    AND p.ativo_ao_vivo = true
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND public.calculate_distance(user_lat, user_lon, p.latitude, p.longitude) <= max_distance_km
  ORDER BY distance_km ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;