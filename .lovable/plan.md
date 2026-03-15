

## Diagnóstico

Os dados **não foram deletados**. O erro real nos logs é:

```
"infinite recursion detected in policy for relation 'profiles'"
```

**Causa raiz**: A RLS policy "Estabelecimentos podem ver gorjetas do local" na tabela `gorjetas` faz um `SELECT` na tabela `profiles`. Quando a tabela `profiles` avalia a policy "Users can see profiles they interacted with", ela consulta `gorjetas`. Isso cria um ciclo infinito:

```text
profiles SELECT → policy queries gorjetas → gorjetas RLS queries profiles → ∞
```

Essa policy foi adicionada na migração recente que vinculou gorjetas a estabelecimentos.

## Plano de correção

**1. Criar uma função SECURITY DEFINER** para verificar `mostrar_gorjetas_local` sem disparar RLS na tabela profiles:

```sql
CREATE OR REPLACE FUNCTION public.artist_shows_tips_to_local(p_artista_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(mostrar_gorjetas_local, false)
  FROM profiles WHERE id = p_artista_id;
$$;
```

**2. Substituir a RLS policy problemática** na tabela `gorjetas`:

- DROP a policy atual "Estabelecimentos podem ver gorjetas do local"
- Criar nova policy usando a função acima em vez de subconsulta direta na profiles

Isso elimina a recursão e restaura imediatamente a visibilidade de todos os artistas e estabelecimentos.

