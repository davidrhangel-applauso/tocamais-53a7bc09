-- Atualizar função de notificação de nova gorjeta para mostrar valor líquido
CREATE OR REPLACE FUNCTION public.notificar_nova_gorjeta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cliente_nome text;
BEGIN
  SELECT nome INTO v_cliente_nome
  FROM profiles
  WHERE id = NEW.cliente_id;
  
  PERFORM criar_notificacao(
    NEW.artista_id,
    'gorjeta',
    'Nova Gorjeta Recebida',
    v_cliente_nome || ' enviou uma gorjeta de R$ ' || NEW.valor_liquido_artista::text || ' (valor líquido)',
    '/painel',
    jsonb_build_object('gorjeta_id', NEW.id)
  );
  
  RETURN NEW;
END;
$function$;

-- Atualizar função de notificação de pagamento aprovado para mostrar valor líquido
CREATE OR REPLACE FUNCTION public.notificar_pagamento_aprovado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      v_cliente_nome || ' enviou uma gorjeta de R$ ' || NEW.valor_liquido_artista::text || ' (você receberá 90% do valor)',
      '/painel',
      jsonb_build_object('gorjeta_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;