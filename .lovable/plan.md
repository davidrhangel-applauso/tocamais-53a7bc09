

## Limitar Gorjetas para Artistas Free (R$ 10)

### Problema Atual
O hook `useFreeTipLimit` e o modal `FreeLimitReachedModal` ja existem no painel do artista, mas nao ha **bloqueio real** no momento de confirmar o pagamento. Um artista Free pode continuar recebendo gorjetas alem do limite porque nenhuma verificacao e feita quando o PIX e confirmado.

### Onde o bloqueio precisa acontecer

```text
Fluxo atual sem bloqueio:

Cliente abre perfil -> Envia PIX -> Artista confirma -> Gorjeta criada (sem limite)

Fluxo corrigido:

1. Cliente abre perfil -> Verifica limite -> Se atingido, desabilita botao de gorjeta
2. Artista confirma PIX -> Verifica limite via RPC -> Se atingido, rejeita + mostra modal PRO
```

### Mudancas necessarias

#### 1. Funcao SQL: `confirm_direct_pix_payment_with_limit`
Criar uma nova funcao RPC (ou modificar `confirm_direct_pix_payment`) que, ao confirmar PIX de artista Free:
- Consulta `get_artist_approved_total` para verificar se o total + novo valor ultrapassa R$ 10
- Consulta `is_artist_pro` para saber se e PRO
- Se limite atingido, retorna erro `FREE_LIMIT_REACHED` sem criar gorjeta
- Se dentro do limite, cria a gorjeta diretamente dentro da funcao (atomico)
- Dispara notificacao automatica via `criar_notificacao` quando o limite e atingido

Isso resolve o problema de race condition e garante atomicidade (a verificacao e insercao acontecem na mesma transacao no banco).

#### 2. Hook `useConfirmPixPayment` (src/hooks/useArtistPedidos.ts)
- Substituir a logica atual de criar gorjeta manualmente pelo client por uma chamada a nova funcao RPC
- Tratar o erro `FREE_LIMIT_REACHED` de forma especifica, exibindo o modal de upgrade PRO

#### 3. Perfil do Artista - lado do cliente (src/pages/ArtistProfile.tsx)
- Antes de exibir o botao de gorjeta, verificar se o artista Free atingiu o limite
- Usar `supabase.rpc('get_artist_approved_total')` para consultar o total
- Se limite atingido: mostrar mensagem "Este artista atingiu o limite de gorjetas gratuitas" e desabilitar o botao
- Tambem verificar `is_artist_pro` para determinar se a verificacao e necessaria

#### 4. Painel do Artista (src/pages/ArtistPanel.tsx)
- Quando o artista tenta confirmar PIX e recebe erro `FREE_LIMIT_REACHED`, abrir o `FreeLimitReachedModal` automaticamente
- Desabilitar o botao "Confirmar PIX" nos pedidos aguardando quando `limitReached = true`

#### 5. Notificacoes
- A funcao SQL dispara `criar_notificacao` com tipo `limite_free_atingido` quando o artista atinge o limite pela primeira vez
- Mensagem: "Voce atingiu o limite de R$ 10 em gorjetas gratuitas! Assine o PRO para continuar recebendo."
- Link: `/pro-sales`

### Detalhes Tecnicos

**Migracao SQL:**
- Criar funcao `confirm_pix_with_limit_check(p_pedido_id uuid, p_artista_id uuid, p_is_artist_confirming boolean)` que:
  1. Verifica se artista e PRO
  2. Se Free, consulta total aprovado
  3. Se total + valor >= 10, retorna `{success: false, error: 'FREE_LIMIT_REACHED'}`
  4. Se ok, insere gorjeta e atualiza pedido atomicamente
  5. Envia notificacao se limite atingido

**Arquivos a modificar:**
- `src/hooks/useArtistPedidos.ts` - Alterar `useConfirmPixPayment` para usar nova RPC e tratar erro de limite
- `src/pages/ArtistProfile.tsx` - Adicionar verificacao de limite no perfil publico do artista
- `src/pages/ArtistPanel.tsx` - Integrar tratamento do erro `FREE_LIMIT_REACHED` com o modal existente

**Nenhum arquivo novo necessario** - os componentes `FreeLimitReachedModal` e `useFreeTipLimit` ja existem.

**Constante de limite:** R$ 10,00 definida na funcao SQL e no frontend (`FREE_TIP_LIMIT` em `useFreeTipLimit.ts`).
