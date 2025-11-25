-- Adicionar campo mercadopago_seller_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN mercadopago_seller_id TEXT;

-- Comentário explicando o campo
COMMENT ON COLUMN public.profiles.mercadopago_seller_id IS 'ID do vendedor no Mercado Pago para split de pagamentos';