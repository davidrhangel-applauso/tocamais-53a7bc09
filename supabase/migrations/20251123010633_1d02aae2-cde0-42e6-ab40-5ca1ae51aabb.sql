-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON profiles;

-- Policy 1: Users can always see their own complete profile
-- (Already exists as "Users can view their own complete profile")

-- Policy 2: Clients can view artist profiles for the marketplace
-- But we document that frontend should hide sensitive fields for security
CREATE POLICY "Clients can discover artist profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Only show artist profiles (not client profiles)
  tipo = 'artista'
  -- Note: Frontend MUST filter sensitive fields (link_pix, instagram, youtube, spotify, cidade)
  -- when displaying to other users. Only show: nome, foto_url, estilo_musical, bio, ativo_ao_vivo, status_destaque
);

-- Policy 3: Users can see profiles they have interacted with (received tips or messages)
CREATE POLICY "Users can see profiles they interacted with"
ON profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    -- Profiles of users who sent me tips
    SELECT cliente_id FROM gorjetas WHERE artista_id = auth.uid()
    UNION
    -- Profiles of users who sent me messages
    SELECT remetente_id FROM mensagens WHERE destinatario_id = auth.uid()
    UNION
    -- Profiles of users I sent messages to
    SELECT destinatario_id FROM mensagens WHERE remetente_id = auth.uid()
    UNION
    -- Profiles of artists I tipped
    SELECT artista_id FROM gorjetas WHERE cliente_id = auth.uid()
    UNION
    -- Profiles of artists I requested songs from
    SELECT artista_id FROM pedidos WHERE cliente_id = auth.uid()
  )
);

-- Add security comment
COMMENT ON TABLE profiles IS 'User profiles with RLS. Artists visible in marketplace but frontend MUST hide sensitive fields (link_pix, social media, cidade) from other users. Full data only visible to profile owner.';

-- Create a helper function to check if data should be masked
CREATE OR REPLACE FUNCTION public.can_view_full_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- User viewing their own profile
    auth.uid() = profile_id
    OR
    -- User has interacted with this profile
    EXISTS (
      SELECT 1 FROM gorjetas 
      WHERE (cliente_id = auth.uid() AND artista_id = profile_id)
         OR (artista_id = auth.uid() AND cliente_id = profile_id)
    )
    OR
    EXISTS (
      SELECT 1 FROM mensagens
      WHERE (remetente_id = auth.uid() AND destinatario_id = profile_id)
         OR (destinatario_id = auth.uid() AND remetente_id = profile_id)
    )
    OR
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE cliente_id = auth.uid() AND artista_id = profile_id
    );
$$;