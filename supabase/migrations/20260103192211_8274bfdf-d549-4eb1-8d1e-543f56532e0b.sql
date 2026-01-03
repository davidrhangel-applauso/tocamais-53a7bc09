-- Add archived column to pedidos table
ALTER TABLE public.pedidos 
ADD COLUMN arquivado boolean NOT NULL DEFAULT false;

-- Add archived_at timestamp for tracking when it was archived
ALTER TABLE public.pedidos 
ADD COLUMN arquivado_at timestamp with time zone DEFAULT NULL;

-- Create index for better performance when filtering archived pedidos
CREATE INDEX idx_pedidos_arquivado ON public.pedidos (artista_id, arquivado);