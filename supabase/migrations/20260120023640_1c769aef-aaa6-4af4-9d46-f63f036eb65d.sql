-- Adicionar novo tipo de usuário 'estabelecimento'
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'estabelecimento';

-- Adicionar campos para estabelecimentos na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS telefone text,
ADD COLUMN IF NOT EXISTS tipo_estabelecimento text;