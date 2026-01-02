-- Update is_artist_pro function to accept admin-granted permanent PRO
CREATE OR REPLACE FUNCTION public.is_artist_pro(artist_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    LEFT JOIN artist_subscriptions s ON s.artista_id = p.id AND s.status = 'active'
    WHERE p.id = artist_id 
    AND p.plano = 'pro'
    AND (
      s.id IS NULL  -- PRO without subscription record (admin-granted)
      OR s.ends_at IS NULL  -- PRO with permanent subscription (admin-granted)
      OR s.ends_at > now()  -- PRO with active paid subscription
    )
  );
$function$;