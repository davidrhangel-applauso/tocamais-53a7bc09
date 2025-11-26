-- Evitar erro ao notificar mudança de status de pedidos anônimos (cliente_id NULL)
CREATE OR REPLACE FUNCTION public.notificar_status_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_artista_nome text;
BEGIN
  -- Se o pedido não tem cliente associado (anônimo), não criar notificação
  IF NEW.cliente_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status != OLD.status THEN
    SELECT nome INTO v_artista_nome
    FROM profiles
    WHERE id = NEW.artista_id;
    
    IF NEW.status = 'aceito' THEN
      PERFORM criar_notificacao(
        NEW.cliente_id,
        'pedido_aceito',
        'Pedido Aceito!',
        v_artista_nome || ' aceitou seu pedido: ' || NEW.musica,
        '/home',
        jsonb_build_object('pedido_id', NEW.id)
      );
    ELSIF NEW.status = 'recusado' THEN
      PERFORM criar_notificacao(
        NEW.cliente_id,
        'pedido_recusado',
        'Pedido Recusado',
        v_artista_nome || ' recusou seu pedido: ' || NEW.musica,
        '/home',
        jsonb_build_object('pedido_id', NEW.id)
      );
    ELSIF NEW.status = 'concluido' THEN
      PERFORM criar_notificacao(
        NEW.cliente_id,
        'pedido_concluido',
        'Pedido Concluído!',
        v_artista_nome || ' tocou sua música: ' || NEW.musica,
        '/home',
        jsonb_build_object('pedido_id', NEW.id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;