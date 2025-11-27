-- Adicionar colunas para pedido musical na tabela gorjetas
ALTER TABLE gorjetas ADD COLUMN IF NOT EXISTS pedido_musica TEXT;
ALTER TABLE gorjetas ADD COLUMN IF NOT EXISTS pedido_mensagem TEXT;

-- Criar função para criar pedido automaticamente quando gorjeta com pedido for aprovada
CREATE OR REPLACE FUNCTION public.criar_pedido_de_gorjeta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se a gorjeta foi aprovada e tem pedido de música, criar pedido
  IF NEW.status_pagamento = 'approved' 
     AND (OLD.status_pagamento IS NULL OR OLD.status_pagamento != 'approved')
     AND NEW.pedido_musica IS NOT NULL 
     AND NEW.pedido_musica != '' THEN
    
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
  
  RETURN NEW;
END;
$$;

-- Criar trigger para criar pedido quando gorjeta for aprovada
DROP TRIGGER IF EXISTS trigger_criar_pedido_de_gorjeta ON gorjetas;
CREATE TRIGGER trigger_criar_pedido_de_gorjeta
  AFTER INSERT OR UPDATE ON gorjetas
  FOR EACH ROW
  EXECUTE FUNCTION criar_pedido_de_gorjeta();