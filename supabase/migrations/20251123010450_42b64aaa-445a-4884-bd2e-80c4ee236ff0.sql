-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Clientes can create gorjetas" ON gorjetas;

-- Create a security definer function to check if user is a client (not an artist)
CREATE OR REPLACE FUNCTION public.is_client(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = user_id 
    AND tipo = 'cliente'
  );
$$;

-- Create a more secure policy with multiple validations
CREATE POLICY "Only authenticated clients can create gorjetas for artists"
ON gorjetas
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be authenticated and match cliente_id
  auth.uid() = cliente_id
  -- User must be a client (not an artist)
  AND public.is_client(auth.uid())
  -- Cannot tip yourself (cliente_id must be different from artista_id)
  AND cliente_id != artista_id
  -- Artista must exist and be an artist type
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = artista_id 
    AND tipo = 'artista'
  )
);

-- Add helpful comment
COMMENT ON POLICY "Only authenticated clients can create gorjetas for artists" ON gorjetas IS 'Prevents artists from creating fake tips by validating user is a client and cannot tip themselves';