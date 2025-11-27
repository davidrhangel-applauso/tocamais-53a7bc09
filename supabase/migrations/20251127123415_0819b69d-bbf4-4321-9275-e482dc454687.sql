-- Corrigir função de notificação de pagamento aprovado para lidar com clientes anônimos
CREATE OR REPLACE FUNCTION public.notificar_pagamento_aprovado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_cliente_nome text;
BEGIN
  -- Apenas notificar quando status mudar para 'approved'
  IF NEW.status_pagamento = 'approved' AND (OLD.status_pagamento IS NULL OR OLD.status_pagamento != 'approved') THEN
    -- Obter nome do cliente ou usar nome fornecido manualmente
    IF NEW.cliente_id IS NOT NULL THEN
      SELECT nome INTO v_cliente_nome
      FROM profiles
      WHERE id = NEW.cliente_id;
    ELSE
      -- Se cliente_id for null, usar cliente_nome (preenchido manualmente)
      v_cliente_nome := COALESCE(NEW.cliente_nome, 'Um fã');
    END IF;
    
    -- Garantir que v_cliente_nome nunca seja null
    v_cliente_nome := COALESCE(v_cliente_nome, 'Um fã');
    
    PERFORM criar_notificacao(
      NEW.artista_id,
      'pagamento_aprovado',
      'Gorjeta Confirmada!',
      v_cliente_nome || ' enviou uma gorjeta de R$ ' || NEW.valor::text,
      '/painel',
      jsonb_build_object('gorjeta_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;