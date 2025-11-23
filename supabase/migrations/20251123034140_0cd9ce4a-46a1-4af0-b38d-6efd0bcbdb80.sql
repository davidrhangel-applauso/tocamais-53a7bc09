-- Adicionar campos para controle de taxas da plataforma
ALTER TABLE gorjetas 
ADD COLUMN IF NOT EXISTS valor_liquido_artista NUMERIC,
ADD COLUMN IF NOT EXISTS taxa_plataforma NUMERIC;

-- Atualizar registros existentes (retroativo)
-- Assumindo que o valor atual é o valor bruto
UPDATE gorjetas 
SET 
  valor_liquido_artista = valor * 0.90,
  taxa_plataforma = valor * 0.10
WHERE valor_liquido_artista IS NULL;

-- Tornar os campos obrigatórios para novos registros
ALTER TABLE gorjetas
ALTER COLUMN valor_liquido_artista SET NOT NULL,
ALTER COLUMN taxa_plataforma SET NOT NULL;