-- Tabela de check-ins de artistas em estabelecimentos
CREATE TABLE public.estabelecimento_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artista_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  artista_nome text, -- Para artistas não cadastrados
  inicio timestamp with time zone NOT NULL DEFAULT now(),
  fim timestamp with time zone, -- NULL = ainda ativo
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de pedidos feitos via estabelecimento
CREATE TABLE public.pedidos_estabelecimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id uuid REFERENCES estabelecimento_checkins(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  cliente_nome text,
  session_id text NOT NULL,
  musica text NOT NULL,
  mensagem text,
  status text DEFAULT 'pendente', -- pendente, aceito, recusado, concluido
  created_at timestamp with time zone DEFAULT now(),
  arquivado boolean DEFAULT false,
  arquivado_at timestamp with time zone
);

-- Tabela de avaliações de artistas por clientes
CREATE TABLE public.avaliacoes_artistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id uuid NOT NULL REFERENCES estabelecimento_checkins(id) ON DELETE CASCADE,
  artista_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  artista_nome text,
  cliente_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  cliente_nome text,
  nota integer NOT NULL,
  comentario text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nota_valida CHECK (nota >= 1 AND nota <= 5)
);

-- Habilitar RLS
ALTER TABLE public.estabelecimento_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_estabelecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_artistas ENABLE ROW LEVEL SECURITY;

-- Função para verificar se é estabelecimento
CREATE OR REPLACE FUNCTION public.is_estabelecimento(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = user_id 
    AND tipo = 'estabelecimento'
  );
$$;

-- Função para verificar se artista tem check-in ativo em um estabelecimento
CREATE OR REPLACE FUNCTION public.has_active_checkin(artist_id uuid, estabelecimento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM estabelecimento_checkins 
    WHERE artista_id = artist_id 
    AND estabelecimento_checkins.estabelecimento_id = has_active_checkin.estabelecimento_id
    AND ativo = true
  );
$$;

-- Função para obter o check-in ativo de um artista
CREATE OR REPLACE FUNCTION public.get_artist_active_checkin(artist_id uuid)
RETURNS TABLE(
  checkin_id uuid,
  estabelecimento_id uuid,
  estabelecimento_nome text,
  inicio timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ec.id as checkin_id,
    ec.estabelecimento_id,
    p.nome as estabelecimento_nome,
    ec.inicio
  FROM estabelecimento_checkins ec
  JOIN profiles p ON p.id = ec.estabelecimento_id
  WHERE ec.artista_id = artist_id
  AND ec.ativo = true
  LIMIT 1;
$$;

-- Função para obter o check-in ativo de um estabelecimento
CREATE OR REPLACE FUNCTION public.get_estabelecimento_active_checkin(estab_id uuid)
RETURNS TABLE(
  checkin_id uuid,
  artista_id uuid,
  artista_nome text,
  artista_foto text,
  inicio timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ec.id as checkin_id,
    ec.artista_id,
    COALESCE(p.nome, ec.artista_nome) as artista_nome,
    p.foto_url as artista_foto,
    ec.inicio
  FROM estabelecimento_checkins ec
  LEFT JOIN profiles p ON p.id = ec.artista_id
  WHERE ec.estabelecimento_id = estab_id
  AND ec.ativo = true
  LIMIT 1;
$$;

-- RLS Policies para estabelecimento_checkins
CREATE POLICY "Estabelecimentos podem ver seus check-ins"
ON public.estabelecimento_checkins
FOR SELECT
USING (auth.uid() = estabelecimento_id);

CREATE POLICY "Artistas podem ver seus check-ins"
ON public.estabelecimento_checkins
FOR SELECT
USING (auth.uid() = artista_id);

CREATE POLICY "Artistas podem criar check-ins"
ON public.estabelecimento_checkins
FOR INSERT
WITH CHECK (auth.uid() = artista_id);

CREATE POLICY "Estabelecimentos podem criar check-ins manuais"
ON public.estabelecimento_checkins
FOR INSERT
WITH CHECK (auth.uid() = estabelecimento_id AND artista_id IS NULL);

CREATE POLICY "Artistas podem atualizar seus check-ins"
ON public.estabelecimento_checkins
FOR UPDATE
USING (auth.uid() = artista_id);

CREATE POLICY "Estabelecimentos podem atualizar check-ins"
ON public.estabelecimento_checkins
FOR UPDATE
USING (auth.uid() = estabelecimento_id);

CREATE POLICY "Qualquer um pode ver check-in ativo para pedidos"
ON public.estabelecimento_checkins
FOR SELECT
USING (ativo = true);

CREATE POLICY "Admins podem ver todos os check-ins"
ON public.estabelecimento_checkins
FOR SELECT
USING (is_admin(auth.uid()));

-- RLS Policies para pedidos_estabelecimento
CREATE POLICY "Estabelecimentos podem ver seus pedidos"
ON public.pedidos_estabelecimento
FOR SELECT
USING (auth.uid() = estabelecimento_id);

CREATE POLICY "Artistas podem ver pedidos do local onde fizeram check-in"
ON public.pedidos_estabelecimento
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM estabelecimento_checkins ec
    WHERE ec.id = pedidos_estabelecimento.checkin_id
    AND ec.artista_id = auth.uid()
    AND ec.ativo = true
  )
);

CREATE POLICY "Clientes autenticados podem criar pedidos"
ON public.pedidos_estabelecimento
FOR INSERT
WITH CHECK (
  auth.uid() = cliente_id 
  AND is_client(auth.uid())
);

CREATE POLICY "Clientes anônimos podem criar pedidos"
ON public.pedidos_estabelecimento
FOR INSERT
WITH CHECK (
  cliente_id IS NULL 
  AND session_id IS NOT NULL
);

CREATE POLICY "Artistas podem atualizar status dos pedidos"
ON public.pedidos_estabelecimento
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM estabelecimento_checkins ec
    WHERE ec.id = pedidos_estabelecimento.checkin_id
    AND ec.artista_id = auth.uid()
    AND ec.ativo = true
  )
);

CREATE POLICY "Estabelecimentos podem atualizar seus pedidos"
ON public.pedidos_estabelecimento
FOR UPDATE
USING (auth.uid() = estabelecimento_id);

CREATE POLICY "Admins podem ver todos os pedidos"
ON public.pedidos_estabelecimento
FOR SELECT
USING (is_admin(auth.uid()));

-- RLS Policies para avaliacoes_artistas
CREATE POLICY "Estabelecimentos podem ver avaliações"
ON public.avaliacoes_artistas
FOR SELECT
USING (auth.uid() = estabelecimento_id);

CREATE POLICY "Artistas podem ver suas avaliações"
ON public.avaliacoes_artistas
FOR SELECT
USING (auth.uid() = artista_id);

CREATE POLICY "Clientes autenticados podem criar avaliações"
ON public.avaliacoes_artistas
FOR INSERT
WITH CHECK (
  auth.uid() = cliente_id
);

CREATE POLICY "Clientes anônimos podem criar avaliações"
ON public.avaliacoes_artistas
FOR INSERT
WITH CHECK (
  cliente_id IS NULL 
  AND session_id IS NOT NULL
);

CREATE POLICY "Admins podem ver todas as avaliações"
ON public.avaliacoes_artistas
FOR SELECT
USING (is_admin(auth.uid()));

-- Habilitar realtime para pedidos do estabelecimento
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_estabelecimento;
ALTER PUBLICATION supabase_realtime ADD TABLE public.estabelecimento_checkins;