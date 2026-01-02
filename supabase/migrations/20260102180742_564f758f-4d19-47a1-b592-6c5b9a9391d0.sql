-- Add RLS policy for admins to view all gorjetas
CREATE POLICY "Admins can view all gorjetas" 
ON public.gorjetas 
FOR SELECT 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- Add RLS policy for admins to view all pedidos
CREATE POLICY "Admins can view all pedidos" 
ON public.pedidos 
FOR SELECT 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- Add RLS policy for admins to view all artist_subscriptions
CREATE POLICY "Admins can view all subscriptions" 
ON public.artist_subscriptions 
FOR SELECT 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- Add RLS policy for admins to update artist_subscriptions (for plan management)
CREATE POLICY "Admins can update all subscriptions" 
ON public.artist_subscriptions 
FOR UPDATE 
TO authenticated 
USING (public.is_admin(auth.uid()));