-- Allow artists to delete their own orders (for cleaning up old orders)
CREATE POLICY "Artists can delete their own pedidos"
ON public.pedidos
FOR DELETE
USING (auth.uid() = artista_id);