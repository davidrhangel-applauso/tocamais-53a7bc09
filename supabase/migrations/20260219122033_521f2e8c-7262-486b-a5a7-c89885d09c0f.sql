
-- Atomic function to confirm PIX payment with Free tier limit check
CREATE OR REPLACE FUNCTION public.confirm_pix_with_limit_check(
  p_pedido_id uuid,
  p_artista_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido RECORD;
  v_is_pro boolean;
  v_current_total numeric;
  v_free_limit numeric := 10.00;
  v_gorjeta_id uuid;
BEGIN
  -- 1. Fetch pedido data
  SELECT id, valor, status, cliente_id, cliente_nome, session_id, musica, mensagem, artista_id
  INTO v_pedido
  FROM pedidos
  WHERE id = p_pedido_id AND artista_id = p_artista_id;

  IF v_pedido.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PEDIDO_NOT_FOUND');
  END IF;

  -- 2. Check pedido is in correct status
  IF v_pedido.status NOT IN ('aguardando_confirmacao_pix', 'aguardando_pix') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATUS');
  END IF;

  -- 3. Validate valor
  IF v_pedido.valor IS NULL OR v_pedido.valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_VALOR');
  END IF;

  -- 4. Check if artist is PRO
  v_is_pro := public.is_artist_pro(p_artista_id);

  -- 5. If Free, check limit
  IF NOT v_is_pro THEN
    SELECT COALESCE(SUM(valor_liquido_artista), 0)
    INTO v_current_total
    FROM gorjetas
    WHERE gorjetas.artista_id = p_artista_id
      AND status_pagamento = 'approved';

    IF v_current_total + v_pedido.valor > v_free_limit THEN
      -- Send notification if this is the first time hitting the limit
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

  -- 6. Create gorjeta atomically
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
    pedido_mensagem
  ) VALUES (
    v_pedido.artista_id,
    v_pedido.cliente_id,
    v_pedido.cliente_nome,
    v_pedido.session_id,
    v_pedido.valor,
    v_pedido.valor,  -- 100% for all artists
    0,               -- 0% fee
    'approved',
    v_pedido.musica,
    v_pedido.mensagem
  )
  RETURNING id INTO v_gorjeta_id;

  -- 7. Update pedido status
  UPDATE pedidos
  SET status = 'pendente'
  WHERE id = p_pedido_id;

  RETURN jsonb_build_object(
    'success', true,
    'gorjeta_id', v_gorjeta_id,
    'valor', v_pedido.valor
  );
END;
$$;
