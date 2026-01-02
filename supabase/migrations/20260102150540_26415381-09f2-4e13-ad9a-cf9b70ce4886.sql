-- Drop the security definer view as it's a security risk
DROP VIEW IF EXISTS public.public_artist_profiles;

-- Drop the function we created (not needed anymore)
DROP FUNCTION IF EXISTS public.get_public_artist_fields(profiles);

-- The policy "Anyone can view basic artist info" already exists and allows SELECT on artist profiles
-- The key is that sensitive data should be controlled at the application level
-- Since we can't mask columns in RLS policies, we need to rely on:
-- 1. The can_view_full_profile function for checking access
-- 2. Application code to filter what's displayed

-- The data is still accessible via RLS but the application should use 
-- the can_view_full_profile function to decide what to show

-- For now, the security model is:
-- - Basic artist info (nome, bio, foto_url, estilo_musical, ativo_ao_vivo) is public for discovery
-- - Sensitive info (instagram, youtube, spotify, link_pix, cidade, etc.) requires interaction
-- This is enforced at the APPLICATION LEVEL using the useProfilePermissions hook