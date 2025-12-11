-- Criar função security definer para consultar gorjetas por session_id
-- Retorna apenas campos não-sensíveis (oculta payment_id, qr_code, qr_code_base64)
CREATE OR REPLACE FUNCTION public.get_gorjeta_by_session(p_session_id text)
RETURNS TABLE (
  id uuid,
  valor numeric,
  status_pagamento text,
  created_at timestamp with time zone,
  artista_id uuid,
  cliente_nome text,
  pedido_musica text,
  pedido_mensagem text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    g.id,
    g.valor,
    g.status_pagamento,
    g.created_at,
    g.artista_id,
    g.cliente_nome,
    g.pedido_musica,
    g.pedido_mensagem
  FROM gorjetas g
  WHERE g.session_id = p_session_id
    -- Validar formato do session_id (deve ter pelo menos 32 caracteres hex)
    AND length(p_session_id) >= 32
    AND p_session_id ~ '^[a-f0-9]+$'
  ORDER BY g.created_at DESC;
$$;

-- Revogar a política RLS que expõe dados sensíveis via session_id
DROP POLICY IF EXISTS "Users can view gorjetas by session" ON public.gorjetas;