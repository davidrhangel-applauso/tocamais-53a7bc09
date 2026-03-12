
CREATE TABLE public.avaliacoes_estabelecimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.profiles(id),
  session_id text NOT NULL,
  nota integer NOT NULL,
  comentario text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.avaliacoes_estabelecimentos ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous or authenticated)
CREATE POLICY "Clientes anônimos podem avaliar estabelecimentos"
ON public.avaliacoes_estabelecimentos
FOR INSERT
TO public
WITH CHECK (cliente_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Clientes autenticados podem avaliar estabelecimentos"
ON public.avaliacoes_estabelecimentos
FOR INSERT
TO public
WITH CHECK (auth.uid() = cliente_id);

-- Estabelecimentos can view their own ratings
CREATE POLICY "Estabelecimentos podem ver suas avaliações"
ON public.avaliacoes_estabelecimentos
FOR SELECT
TO public
USING (auth.uid() = estabelecimento_id);

-- Admins can view all
CREATE POLICY "Admins podem ver todas avaliações de estabelecimentos"
ON public.avaliacoes_estabelecimentos
FOR SELECT
TO public
USING (public.is_admin(auth.uid()));

-- Anyone can view ratings (public)
CREATE POLICY "Qualquer pessoa pode ver avaliações de estabelecimentos"
ON public.avaliacoes_estabelecimentos
FOR SELECT
TO public
USING (true);
