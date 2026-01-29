

# Plano: Corrigir Duplicação de Pedidos no Fluxo PIX Direto

## Diagnóstico Confirmado ✅

O trigger `criar_pedido_de_gorjeta` está criando um pedido duplicado quando o artista confirma um PIX.

**Evidência nos dados:**
- Pedido original: `d08c92d6` criado às 04:00:25
- Pedido duplicado: `d49a0b4c` criado às 04:01:12 (mesmo momento da gorjeta)
- Ambos têm mesma música, cliente, session_id e valor

## Causa Raiz

O trigger foi criado para o fluxo **Mercado Pago**, onde:
1. Cliente paga via MP → gorjeta criada primeiro
2. Trigger cria pedido automaticamente

Mas no fluxo **PIX direto**:
1. Cliente cria pedido primeiro
2. Artista confirma → gorjeta criada
3. **Trigger cria OUTRO pedido (duplicado!)**

## Solução Proposta

Modificar a função `criar_pedido_de_gorjeta` para verificar se já existe um pedido com o mesmo `session_id` e `artista_id` antes de criar um novo.

## Alterações Técnicas

### 1. Migração SQL - Atualizar a função do trigger

```sql
CREATE OR REPLACE FUNCTION public.criar_pedido_de_gorjeta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_pedido_exists boolean;
BEGIN
  -- Se a gorjeta foi aprovada e tem pedido de música, verificar se precisa criar pedido
  IF NEW.status_pagamento = 'approved' 
     AND (OLD.status_pagamento IS NULL OR OLD.status_pagamento != 'approved')
     AND NEW.pedido_musica IS NOT NULL 
     AND NEW.pedido_musica != '' THEN
    
    -- Verificar se já existe um pedido para esta sessão/artista
    SELECT EXISTS (
      SELECT 1 FROM pedidos 
      WHERE session_id = NEW.session_id 
      AND artista_id = NEW.artista_id
      AND (
        musica = NEW.pedido_musica 
        OR created_at >= NEW.created_at - INTERVAL '10 minutes'
      )
    ) INTO v_pedido_exists;
    
    -- Só criar se não existir
    IF NOT v_pedido_exists THEN
      INSERT INTO pedidos (
        artista_id,
        cliente_id,
        cliente_nome,
        session_id,
        musica,
        mensagem,
        status,
        valor
      ) VALUES (
        NEW.artista_id,
        NEW.cliente_id,
        NEW.cliente_nome,
        NEW.session_id,
        NEW.pedido_musica,
        NEW.pedido_mensagem,
        'pendente',
        NEW.valor
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;
```

### 2. Limpeza dos Pedidos Duplicados (opcional)

Posso criar um script para identificar e remover os pedidos duplicados existentes:

```sql
-- Identificar duplicados (mesmo session_id, artista_id, musica, criados em menos de 5 minutos de diferença)
SELECT p1.id, p1.musica, p1.created_at, p2.id as duplicate_id, p2.created_at as dup_created_at
FROM pedidos p1
JOIN pedidos p2 ON p1.session_id = p2.session_id 
  AND p1.artista_id = p2.artista_id 
  AND p1.musica = p2.musica
  AND p1.id < p2.id
  AND p2.created_at - p1.created_at < INTERVAL '5 minutes';
```

## Critérios de Aceite

1. ✅ Gorjeta continua sendo registrada corretamente
2. ✅ No fluxo PIX direto, apenas 1 pedido aparece na lista
3. ✅ No fluxo Mercado Pago (sem pedido prévio), o trigger ainda cria o pedido automaticamente
4. ✅ Dashboard soma corretamente os valores

## Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Atualizar função `criar_pedido_de_gorjeta` com verificação de duplicidade |

## Riscos Mitigados

- A verificação usa `session_id` + `artista_id` + (música OU tempo) para ser precisa
- Fluxo Mercado Pago continua funcionando (não tem pedido prévio)
- Pedidos antigos podem ser limpos manualmente se necessário

