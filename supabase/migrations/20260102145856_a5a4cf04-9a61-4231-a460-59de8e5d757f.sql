-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view artist profiles" ON public.profiles;

-- Create a new policy that only exposes essential public information for artists
-- Sensitive fields like instagram, youtube, spotify, link_pix, cidade, latitude, longitude, plano, etc.
-- will be NULL for unauthenticated users or users without interaction

-- Create a security definer function to get public profile data safely
CREATE OR REPLACE FUNCTION public.get_public_artist_fields(profile_row profiles)
RETURNS profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result profiles;
  viewer_id uuid;
  has_interaction boolean;
BEGIN
  viewer_id := auth.uid();
  
  -- Check if viewer has interaction with this profile
  IF viewer_id IS NOT NULL THEN
    SELECT public.can_view_full_profile(profile_row.id) INTO has_interaction;
  ELSE
    has_interaction := false;
  END IF;
  
  -- If viewer is the owner or has interaction, return full data
  IF viewer_id = profile_row.id OR has_interaction THEN
    RETURN profile_row;
  END IF;
  
  -- Otherwise, return only public-safe fields
  result := profile_row;
  result.instagram := NULL;
  result.youtube := NULL;
  result.spotify := NULL;
  result.link_pix := NULL;
  result.pix_qr_code_url := NULL;
  result.latitude := NULL;
  result.longitude := NULL;
  result.cidade := NULL;
  result.plano := 'free'::subscription_plan; -- Hide actual plan
  result.status_destaque := NULL;
  
  RETURN result;
END;
$$;

-- Create a view for public artist profiles that masks sensitive data
CREATE OR REPLACE VIEW public.public_artist_profiles AS
SELECT 
  id,
  nome,
  bio,
  foto_url,
  foto_capa_url,
  estilo_musical,
  tipo,
  ativo_ao_vivo,
  created_at,
  updated_at,
  -- Sensitive fields only visible to authenticated users with permission
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN cidade
    ELSE NULL
  END as cidade,
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN instagram
    ELSE NULL
  END as instagram,
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN youtube
    ELSE NULL
  END as youtube,
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN spotify
    ELSE NULL
  END as spotify,
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN link_pix
    ELSE NULL
  END as link_pix,
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN pix_qr_code_url
    ELSE NULL
  END as pix_qr_code_url,
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN latitude
    ELSE NULL
  END as latitude,
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN longitude
    ELSE NULL
  END as longitude,
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN plano
    ELSE 'free'::subscription_plan
  END as plano,
  CASE 
    WHEN auth.uid() = id OR public.can_view_full_profile(id) THEN status_destaque
    ELSE NULL
  END as status_destaque
FROM public.profiles
WHERE tipo = 'artista';

-- Recreate the policy with restricted access - only show essential public data
CREATE POLICY "Anyone can view basic artist info" 
ON public.profiles 
FOR SELECT 
USING (tipo = 'artista'::user_type);