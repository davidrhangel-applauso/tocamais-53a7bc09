-- Atualizar função do trigger para evitar duplicação de pedidos no fluxo PIX direto
CREATE OR REPLACE FUNCTION public.criar_pedido_de_gorjeta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_pedido_exists boolean;
BEGIN
  -- Se a gorjeta foi aprovada e tem pedido de música, verificar se precisa criar pedido
  IF NEW.status_pagamento = 'approved' 
     AND (OLD.status_pagamento IS NULL OR OLD.status_pagamento != 'approved')
     AND NEW.pedido_musica IS NOT NULL 
     AND NEW.pedido_musica != '' THEN
    
    -- Verificar se já existe um pedido para esta sessão/artista
    -- Usa session_id + artista_id + (música OU tempo de 10 min) para ser preciso
    SELECT EXISTS (
      SELECT 1 FROM pedidos 
      WHERE session_id = NEW.session_id 
      AND artista_id = NEW.artista_id
      AND (
        musica = NEW.pedido_musica 
        OR created_at >= NEW.created_at - INTERVAL '10 minutes'
      )
    ) INTO v_pedido_exists;
    
    -- Só criar pedido se não existir (evita duplicados no fluxo PIX direto)
    IF NOT v_pedido_exists THEN
      INSERT INTO pedidos (
        artista_id,
        cliente_id,
        cliente_nome,
        session_id,
        musica,
        mensagem,
        status,
        valor
      ) VALUES (
        NEW.artista_id,
        NEW.cliente_id,
        NEW.cliente_nome,
        NEW.session_id,
        NEW.pedido_musica,
        NEW.pedido_mensagem,
        'pendente',
        NEW.valor
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;