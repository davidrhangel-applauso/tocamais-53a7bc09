-- Add explicit policy to deny direct user inserts to notificacoes
-- Notifications should only be created via SECURITY DEFINER functions (criar_notificacao)
-- This prevents users from spamming fake notifications

CREATE POLICY "Deny direct user inserts to notificacoes"
ON public.notificacoes
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny anonymous inserts to notificacoes"
ON public.notificacoes
FOR INSERT
TO anon
WITH CHECK (false);