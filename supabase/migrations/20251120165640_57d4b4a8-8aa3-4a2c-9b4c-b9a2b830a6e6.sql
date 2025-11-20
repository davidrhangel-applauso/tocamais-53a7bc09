-- Criar tabela de notificações
CREATE TABLE public.notificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  usuario_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  link text,
  data jsonb
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notificacoes"
ON public.notificacoes
FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own notificacoes"
ON public.notificacoes
FOR UPDATE
USING (auth.uid() = usuario_id);

-- Criar função para enviar notificação
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  p_usuario_id uuid,
  p_tipo text,
  p_titulo text,
  p_mensagem text,
  p_link text DEFAULT NULL,
  p_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notificacao_id uuid;
BEGIN
  INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, data)
  VALUES (p_usuario_id, p_tipo, p_titulo, p_mensagem, p_link, p_data)
  RETURNING id INTO v_notificacao_id;
  
  RETURN v_notificacao_id;
END;
$$;

-- Trigger para notificar artista sobre novo pedido
CREATE OR REPLACE FUNCTION public.notificar_novo_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_nome text;
BEGIN
  SELECT nome INTO v_cliente_nome
  FROM profiles
  WHERE id = NEW.cliente_id;
  
  PERFORM criar_notificacao(
    NEW.artista_id,
    'pedido',
    'Novo Pedido Musical',
    v_cliente_nome || ' pediu: ' || NEW.musica,
    '/painel',
    jsonb_build_object('pedido_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notificar_novo_pedido
AFTER INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_novo_pedido();

-- Trigger para notificar artista sobre nova gorjeta
CREATE OR REPLACE FUNCTION public.notificar_nova_gorjeta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    v_cliente_nome || ' enviou uma gorjeta de R$ ' || NEW.valor::text,
    '/painel',
    jsonb_build_object('gorjeta_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notificar_nova_gorjeta
AFTER INSERT ON public.gorjetas
FOR EACH ROW
EXECUTE FUNCTION public.notificar_nova_gorjeta();

-- Trigger para notificar sobre nova mensagem
CREATE OR REPLACE FUNCTION public.notificar_nova_mensagem()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remetente_nome text;
BEGIN
  SELECT nome INTO v_remetente_nome
  FROM profiles
  WHERE id = NEW.remetente_id;
  
  PERFORM criar_notificacao(
    NEW.destinatario_id,
    'mensagem',
    'Nova Mensagem',
    v_remetente_nome || ' enviou uma mensagem',
    '/mensagens',
    jsonb_build_object('mensagem_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notificar_nova_mensagem
AFTER INSERT ON public.mensagens
FOR EACH ROW
EXECUTE FUNCTION public.notificar_nova_mensagem();

-- Trigger para notificar cliente sobre status do pedido
CREATE OR REPLACE FUNCTION public.notificar_status_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artista_nome text;
BEGIN
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
$$;

CREATE TRIGGER trigger_notificar_status_pedido
AFTER UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_status_pedido();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;