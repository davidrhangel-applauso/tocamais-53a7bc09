-- Tabela para configurações do admin (incluindo dados do Pix)
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver/editar configurações
CREATE POLICY "Admins can view settings" ON public.admin_settings
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert settings" ON public.admin_settings
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update settings" ON public.admin_settings
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete settings" ON public.admin_settings
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Inserir configurações padrão
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('subscription_pix_key', ''),
  ('subscription_pix_key_type', 'cpf'),
  ('subscription_pix_name', 'TocaMais'),
  ('subscription_pix_city', 'São Paulo'),
  ('subscription_price', '19.90');

-- Tabela para comprovantes de pagamento
CREATE TABLE public.subscription_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.artist_subscriptions(id) ON DELETE CASCADE,
  artista_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receipt_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id)
);

-- Habilitar RLS
ALTER TABLE public.subscription_receipts ENABLE ROW LEVEL SECURITY;

-- Artistas podem ver seus próprios comprovantes
CREATE POLICY "Artists can view own receipts" ON public.subscription_receipts
  FOR SELECT USING (auth.uid() = artista_id);

-- Artistas podem inserir seus próprios comprovantes
CREATE POLICY "Artists can insert own receipts" ON public.subscription_receipts
  FOR INSERT WITH CHECK (auth.uid() = artista_id);

-- Admins podem ver todos os comprovantes
CREATE POLICY "Admins can view all receipts" ON public.subscription_receipts
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admins podem atualizar comprovantes
CREATE POLICY "Admins can update receipts" ON public.subscription_receipts
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Criar bucket para comprovantes se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para comprovantes
CREATE POLICY "Artists can upload own receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Artists can view own receipts storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all receipts storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' 
    AND public.is_admin(auth.uid())
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();