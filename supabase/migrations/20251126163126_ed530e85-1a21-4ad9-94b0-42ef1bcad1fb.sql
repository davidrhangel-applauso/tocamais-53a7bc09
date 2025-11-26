-- Adicionar campos para suporte a clientes anônimos

-- 1. Tornar cliente_id opcional e adicionar campos de identificação
ALTER TABLE public.pedidos 
  ALTER COLUMN cliente_id DROP NOT NULL,
  ADD COLUMN cliente_nome TEXT,
  ADD COLUMN session_id TEXT;

ALTER TABLE public.gorjetas 
  ALTER COLUMN cliente_id DROP NOT NULL,
  ADD COLUMN cliente_nome TEXT,
  ADD COLUMN session_id TEXT;

-- 2. Criar índices para melhor performance
CREATE INDEX idx_pedidos_session_id ON public.pedidos(session_id);
CREATE INDEX idx_gorjetas_session_id ON public.gorjetas(session_id);

-- 3. Atualizar RLS policies para permitir acesso anônimo

-- Pedidos: permitir criação anônima
DROP POLICY IF EXISTS "Clientes can create pedidos" ON public.pedidos;

CREATE POLICY "Authenticated clients can create pedidos" 
ON public.pedidos 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Anonymous users can create pedidos" 
ON public.pedidos 
FOR INSERT 
TO anon
WITH CHECK (
  cliente_id IS NULL 
  AND session_id IS NOT NULL 
  AND artista_id IS NOT NULL
);

-- Pedidos: permitir visualização por session_id
CREATE POLICY "Users can view pedidos by session" 
ON public.pedidos 
FOR SELECT 
TO anon, authenticated
USING (
  session_id IS NOT NULL 
  AND session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

-- Gorjetas: permitir criação anônima
DROP POLICY IF EXISTS "Only authenticated clients can create gorjetas for artists" ON public.gorjetas;

CREATE POLICY "Authenticated clients can create gorjetas" 
ON public.gorjetas 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = cliente_id 
  AND is_client(auth.uid()) 
  AND cliente_id <> artista_id
);

CREATE POLICY "Anonymous users can create gorjetas" 
ON public.gorjetas 
FOR INSERT 
TO anon
WITH CHECK (
  cliente_id IS NULL 
  AND session_id IS NOT NULL 
  AND artista_id IS NOT NULL
);

-- Gorjetas: permitir visualização por session_id
CREATE POLICY "Users can view gorjetas by session" 
ON public.gorjetas 
FOR SELECT 
TO anon, authenticated
USING (
  session_id IS NOT NULL 
  AND session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

-- 4. Atualizar notificações para usar cliente_nome quando cliente_id for null
CREATE OR REPLACE FUNCTION public.notificar_novo_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cliente_nome text;
BEGIN
  IF NEW.cliente_id IS NOT NULL THEN
    SELECT nome INTO v_cliente_nome
    FROM profiles
    WHERE id = NEW.cliente_id;
  ELSE
    v_cliente_nome := COALESCE(NEW.cliente_nome, 'Cliente Anônimo');
  END IF;
  
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
$function$;

CREATE OR REPLACE FUNCTION public.notificar_nova_gorjeta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cliente_nome text;
BEGIN
  IF NEW.cliente_id IS NOT NULL THEN
    SELECT nome INTO v_cliente_nome
    FROM profiles
    WHERE id = NEW.cliente_id;
  ELSE
    v_cliente_nome := COALESCE(NEW.cliente_nome, 'Cliente Anônimo');
  END IF;
  
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