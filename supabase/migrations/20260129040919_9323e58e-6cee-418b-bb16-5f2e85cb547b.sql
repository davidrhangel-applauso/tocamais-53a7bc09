-- Permitir que usuários autenticados vejam perfis de estabelecimentos (para check-in de artistas)
CREATE POLICY "Anyone can view basic estabelecimento info" 
ON public.profiles 
FOR SELECT 
USING (tipo = 'estabelecimento');