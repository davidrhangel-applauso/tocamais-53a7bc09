-- Add PIX own payment fields for PRO artists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pix_chave TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pix_tipo_chave TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pix_qr_code_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.pix_chave IS 'Artist own PIX key for direct payments (PRO only)';
COMMENT ON COLUMN public.profiles.pix_tipo_chave IS 'Type of PIX key: cpf, email, celular, aleatoria';
COMMENT ON COLUMN public.profiles.pix_qr_code_url IS 'URL of PIX QR code image in storage';