-- Adicionar campos de pagamento Pix na tabela gorjetas
ALTER TABLE public.gorjetas
ADD COLUMN payment_id text,
ADD COLUMN status_pagamento text DEFAULT 'pending',
ADD COLUMN qr_code text,
ADD COLUMN qr_code_base64 text,
ADD COLUMN expires_at timestamp with time zone;

-- Criar índice para buscar gorjetas por payment_id
CREATE INDEX idx_gorjetas_payment_id ON public.gorjetas(payment_id);

-- Criar índice para buscar gorjetas pendentes
CREATE INDEX idx_gorjetas_status ON public.gorjetas(status_pagamento);

-- Criar função para notificar artista quando pagamento for aprovado
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
    SELECT nome INTO v_cliente_nome
    FROM profiles
    WHERE id = NEW.cliente_id;
    
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

-- Criar trigger para notificar pagamento aprovado
CREATE TRIGGER trigger_notificar_pagamento_aprovado
AFTER UPDATE ON public.gorjetas
FOR EACH ROW
EXECUTE FUNCTION public.notificar_pagamento_aprovado();