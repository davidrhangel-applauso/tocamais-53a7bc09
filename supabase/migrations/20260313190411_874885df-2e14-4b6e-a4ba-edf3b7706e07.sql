
-- Add estabelecimento_id to pedidos to track origin
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS estabelecimento_id uuid;

-- Update confirm_pix_with_limit_check to carry over estabelecimento_id to gorjeta
CREATE OR REPLACE FUNCTION public.confirm_pix_with_limit_check(p_pedido_id uuid, p_artista_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido RECORD;
  v_is_pro boolean;
  v_current_total numeric;
  v_free_limit numeric := 10.00;
  v_gorjeta_id uuid;
BEGIN
  SELECT id, valor, status, cliente_id, cliente_nome, session_id, musica, mensagem, artista_id, estabelecimento_id
  INTO v_pedido
  FROM pedidos
  WHERE id = p_pedido_id AND artista_id = p_artista_id;

  IF v_pedido.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PEDIDO_NOT_FOUND');
  END IF;

  IF v_pedido.status NOT IN ('aguardando_confirmacao_pix', 'aguardando_pix') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATUS');
  END IF;

  IF v_pedido.valor IS NULL OR v_pedido.valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_VALOR');
  END IF;

  v_is_pro := public.is_artist_pro(p_artista_id);

  IF NOT v_is_pro THEN
    SELECT COALESCE(SUM(valor_liquido_artista), 0)
    INTO v_current_total
    FROM gorjetas
    WHERE gorjetas.artista_id = p_artista_id
      AND status_pagamento = 'approved';

    IF v_current_total + v_pedido.valor > v_free_limit THEN
      IF v_current_total < v_free_limit THEN
        PERFORM public.criar_notificacao(
          p_artista_id,
          'limite_free_atingido',
          'Limite de gorjetas atingido!',
          'Você atingiu o limite de R$ 10 em gorjetas gratuitas! Assine o PRO para continuar recebendo.',
          '/pro-sales',
          NULL
        );
      END IF;

      RETURN jsonb_build_object('success', false, 'error', 'FREE_LIMIT_REACHED', 'current_total', v_current_total, 'limit', v_free_limit);
    END IF;
  END IF;

  INSERT INTO gorjetas (
    artista_id,
    cliente_id,
    cliente_nome,
    session_id,
    valor,
    valor_liquido_artista,
    taxa_plataforma,
    status_pagamento,
    pedido_musica,
    pedido_mensagem,
    estabelecimento_id
  ) VALUES (
    v_pedido.artista_id,
    v_pedido.cliente_id,
    v_pedido.cliente_nome,
    v_pedido.session_id,
    v_pedido.valor,
    v_pedido.valor,
    0,
    'approved',
    v_pedido.musica,
    v_pedido.mensagem,
    v_pedido.estabelecimento_id
  )
  RETURNING id INTO v_gorjeta_id;

  UPDATE pedidos
  SET status = 'pendente'
  WHERE id = p_pedido_id;

  RETURN jsonb_build_object(
    'success', true,
    'gorjeta_id', v_gorjeta_id,
    'valor', v_pedido.valor
  );
END;
$function$;

-- Update criar_pedido_de_gorjeta trigger to carry over estabelecimento_id
CREATE OR REPLACE FUNCTION public.criar_pedido_de_gorjeta()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_exists boolean;
BEGIN
  IF NEW.status_pagamento = 'approved' 
     AND (OLD.status_pagamento IS NULL OR OLD.status_pagamento != 'approved')
     AND NEW.pedido_musica IS NOT NULL 
     AND NEW.pedido_musica != '' THEN
    
    SELECT EXISTS (
      SELECT 1 FROM pedidos 
      WHERE session_id = NEW.session_id 
      AND artista_id = NEW.artista_id
      AND (
        musica = NEW.pedido_musica 
        OR created_at >= NEW.created_at - INTERVAL '10 minutes'
      )
    ) INTO v_pedido_exists;
    
    IF NOT v_pedido_exists THEN
      INSERT INTO pedidos (
        artista_id,
        cliente_id,
        cliente_nome,
        session_id,
        musica,
        mensagem,
        status,
        valor,
        estabelecimento_id
      ) VALUES (
        NEW.artista_id,
        NEW.cliente_id,
        NEW.cliente_nome,
        NEW.session_id,
        NEW.pedido_musica,
        NEW.pedido_mensagem,
        'pendente',
        NEW.valor,
        NEW.estabelecimento_id
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;
