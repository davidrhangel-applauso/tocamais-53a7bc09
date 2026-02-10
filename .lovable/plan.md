
## Correcao: Badge "Recomendado" Oculto

### Problema
O badge "Recomendado" esta sendo cortado porque esta dentro de um `div` com `overflow-hidden` (linha 44). O badge usa `absolute top-0 -translate-y-1/2` para ficar acima da borda, mas o `overflow-hidden` do container pai corta qualquer conteudo que saia dos limites.

### Solucao
Mover o badge para fora do grid do header, posicionando-o diretamente no container principal (que ja tem `overflow-visible`). Assim ele nao sera afetado pelo `overflow-hidden` do header.

### Detalhes Tecnicos

**Arquivo:** `src/components/landing/PlanComparison.tsx`

- Remover o `Badge` de dentro da celula do header PRO (linha 51-53)
- Posicionar o `Badge` como filho direto do container principal (linha 42), usando posicionamento absoluto para alinha-lo ao topo da coluna PRO
- Remover o padding-top extra (`pt-8`) que compensava o badge, ja que ele nao ocupara mais espaco interno
- Manter `overflow-hidden` no grid do header para os cantos arredondados
