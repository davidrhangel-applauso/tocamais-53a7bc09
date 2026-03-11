DROP TABLE IF EXISTS public.artist_mercadopago_credentials CASCADE;
DROP FUNCTION IF EXISTS public.get_artist_mercadopago_seller_id(uuid);
DROP FUNCTION IF EXISTS public.has_mercadopago_linked(uuid);