-- Adicionar colunas para armazenar tokens OAuth do Mercado Pago
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_token_expires_at TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.mercadopago_access_token IS 'Token de acesso OAuth do Mercado Pago para split payments';
COMMENT ON COLUMN public.profiles.mercadopago_refresh_token IS 'Token de refresh OAuth do Mercado Pago';
COMMENT ON COLUMN public.profiles.mercadopago_token_expires_at IS 'Data de expiração do access token';