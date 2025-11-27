-- Criar tabela para repertório musical dos artistas
CREATE TABLE public.musicas_repertorio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artista_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  artista_original TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscar músicas por artista
CREATE INDEX idx_musicas_repertorio_artista ON public.musicas_repertorio(artista_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_musicas_repertorio_updated_at
  BEFORE UPDATE ON public.musicas_repertorio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.musicas_repertorio ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Qualquer um pode ver as músicas dos artistas
CREATE POLICY "Anyone can view musicas_repertorio"
  ON public.musicas_repertorio
  FOR SELECT
  USING (true);

-- Artistas podem inserir suas próprias músicas
CREATE POLICY "Artists can insert their own musicas"
  ON public.musicas_repertorio
  FOR INSERT
  WITH CHECK (auth.uid() = artista_id);

-- Artistas podem atualizar suas próprias músicas
CREATE POLICY "Artists can update their own musicas"
  ON public.musicas_repertorio
  FOR UPDATE
  USING (auth.uid() = artista_id);

-- Artistas podem deletar suas próprias músicas
CREATE POLICY "Artists can delete their own musicas"
  ON public.musicas_repertorio
  FOR DELETE
  USING (auth.uid() = artista_id);