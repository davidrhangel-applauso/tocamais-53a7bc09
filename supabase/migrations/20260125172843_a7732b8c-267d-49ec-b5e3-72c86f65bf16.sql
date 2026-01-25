-- Create secure function to confirm direct PIX payment from client
-- This allows clients to update ONLY valor and status of their own pedidos
CREATE OR REPLACE FUNCTION public.confirm_direct_pix_payment(
  p_pedido_id uuid,
  p_valor numeric,
  p_session_id text,
  p_cliente_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido RECORD;
  v_result jsonb;
BEGIN
  -- Validate valor
  IF p_valor IS NULL OR p_valor < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor mínimo é R$ 1,00');
  END IF;

  -- Find the pedido
  SELECT id, status, session_id, cliente_id, artista_id
  INTO v_pedido
  FROM pedidos
  WHERE id = p_pedido_id;

  -- Check pedido exists
  IF v_pedido.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  -- Check pedido is in correct status
  IF v_pedido.status != 'aguardando_pix' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não está aguardando pagamento PIX');
  END IF;

  -- Validate ownership: either session_id matches OR cliente_id matches
  IF (p_session_id IS NOT NULL AND v_pedido.session_id = p_session_id) OR
     (p_cliente_id IS NOT NULL AND v_pedido.cliente_id = p_cliente_id) THEN
    -- Authorized - update the pedido
    UPDATE pedidos
    SET 
      valor = p_valor,
      status = 'aguardando_confirmacao_pix'
    WHERE id = p_pedido_id;

    RETURN jsonb_build_object(
      'success', true, 
      'pedido_id', p_pedido_id,
      'valor', p_valor,
      'status', 'aguardando_confirmacao_pix'
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado a modificar este pedido');
  END IF;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.confirm_direct_pix_payment(uuid, numeric, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_direct_pix_payment(uuid, numeric, text, uuid) TO authenticated;