
-- Add slug column to profiles
ALTER TABLE public.profiles ADD COLUMN slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX profiles_slug_unique ON public.profiles (slug) WHERE slug IS NOT NULL;

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(input_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Normalize: lowercase, remove accents, replace spaces with hyphens, remove special chars
  base_slug := lower(unaccent(input_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(trim(base_slug), '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If empty after processing, use 'artista'
  IF base_slug = '' THEN
    base_slug := 'artista';
  END IF;
  
  -- Check for reserved route slugs
  IF base_slug IN ('auth', 'home', 'painel', 'painel-local', 'buscar', 'artista', 'local', 'admin', 'configuracoes', 'conversas', 'mensagens', 'relatorios', 'instrucoes', 'termos', 'privacidade', 'landing', 'pro', 'redefinir-senha', 'auth-estabelecimento') THEN
    base_slug := base_slug || '-artista';
  END IF;
  
  -- Try base slug first
  final_slug := base_slug;
  
  -- If taken, append incrementing number
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE profiles.slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Enable unaccent extension if not exists
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Update handle_new_user to auto-generate slug for artists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slug text;
  v_tipo user_type;
BEGIN
  v_tipo := COALESCE((NEW.raw_user_meta_data->>'tipo')::user_type, 'cliente');
  
  -- Generate slug for artists
  IF v_tipo = 'artista' THEN
    v_slug := public.generate_slug(COALESCE(NEW.raw_user_meta_data->>'nome', 'artista'));
  END IF;
  
  INSERT INTO public.profiles (id, nome, cidade, tipo, foto_url, slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.raw_user_meta_data->>'cidade',
    v_tipo,
    NEW.raw_user_meta_data->>'foto_url',
    v_slug
  );
  RETURN NEW;
END;
$$;

-- Generate slugs for existing artists that don't have one
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, nome FROM public.profiles WHERE tipo = 'artista' AND slug IS NULL ORDER BY created_at
  LOOP
    UPDATE public.profiles SET slug = public.generate_slug(r.nome) WHERE id = r.id;
  END LOOP;
END;
$$;
