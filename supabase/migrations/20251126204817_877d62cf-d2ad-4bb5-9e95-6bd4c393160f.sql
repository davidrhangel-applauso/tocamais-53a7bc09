-- Criar automaticamente uma mensagem quando um pedido contém uma mensagem
CREATE OR REPLACE FUNCTION public.criar_mensagem_de_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Apenas criar mensagem se o pedido tem cliente_id e mensagem
  IF NEW.cliente_id IS NOT NULL AND NEW.mensagem IS NOT NULL AND NEW.mensagem != '' THEN
    INSERT INTO mensagens (remetente_id, destinatario_id, conteudo)
    VALUES (
      NEW.cliente_id,
      NEW.artista_id,
      '🎵 Pedido: ' || NEW.musica || E'\n\n' || NEW.mensagem
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para executar após inserção de pedido
DROP TRIGGER IF EXISTS trigger_criar_mensagem_de_pedido ON pedidos;
CREATE TRIGGER trigger_criar_mensagem_de_pedido
  AFTER INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION criar_mensagem_de_pedido();