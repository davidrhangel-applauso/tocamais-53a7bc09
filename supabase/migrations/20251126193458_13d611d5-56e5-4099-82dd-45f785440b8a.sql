-- Remover a política antiga que pode estar causando problema
DROP POLICY IF EXISTS "Clients can discover artist profiles" ON profiles;

-- Criar uma nova política que permite a TODOS (autenticados ou não) verem perfis de artistas
CREATE POLICY "Anyone can view artist profiles"
ON profiles
FOR SELECT
TO public
USING (tipo = 'artista');