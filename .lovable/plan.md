

## Plano: Gorjetas visíveis ao estabelecimento + Pedidos do QR Code no painel do artista

### Problemas identificados

1. **Gorjetas não aparecem para o estabelecimento**: A tabela `gorjetas` não tem `estabelecimento_id`, então o painel do estabelecimento não sabe quais gorjetas vieram do seu local.
2. **Artista deve controlar visibilidade dos valores**: Não existe configuração para o artista permitir/bloquear que o estabelecimento veja os valores das gorjetas.
3. **Pedidos do QR Code vão para tabela errada**: `EstabelecimentoProfile.tsx` insere na tabela `pedidos_estabelecimento`, mas o painel do artista (aba "Pedidos") lê da tabela `pedidos`. São tabelas diferentes — por isso os pedidos não aparecem para o artista na aba principal.
4. **Estabelecimento recebe pedidos como itens gerenciáveis**: O usuário quer que o estabelecimento receba apenas notificações, não uma lista de pedidos para aceitar/recusar.

### Implementação

**1. Migração de banco de dados**
- Adicionar coluna `estabelecimento_id uuid` (nullable) na tabela `gorjetas` para rastrear gorjetas originadas do local
- Adicionar coluna `mostrar_gorjetas_local boolean DEFAULT false` na tabela `profiles` para artistas controlarem a visibilidade
- Adicionar RLS policy: estabelecimento pode ver gorjetas onde `estabelecimento_id` = seu id AND artista tem `mostrar_gorjetas_local = true`

**2. Alterar `EstabelecimentoProfile.tsx` — Pedidos vão para tabela `pedidos`**
- Ao enviar pedido de música, inserir na tabela `pedidos` (com `artista_id` do checkin ativo) em vez de `pedidos_estabelecimento`
- Enviar notificação ao estabelecimento via `criar_notificacao()` (RPC) para que ele saiba que um pedido foi feito
- Ao enviar gorjeta, passar `estabelecimento_id` para o `TwoStepPixPaymentDialog`

**3. Atualizar `TwoStepPixPaymentDialog`**
- Aceitar prop opcional `estabelecimentoId` e incluí-lo na criação da gorjeta

**4. Atualizar `EstabelecimentoPanel.tsx`**
- Remover a aba "Pedidos" com aceitar/recusar — substituir por uma lista de notificações/feed de atividades
- Adicionar seção "Gorjetas do Local" que mostra gorjetas onde `estabelecimento_id` = id do local (valores visíveis apenas se o artista permitiu)

**5. Atualizar `Settings.tsx` (artista)**
- Adicionar toggle "Permitir que estabelecimentos vejam valores das gorjetas" controlando `mostrar_gorjetas_local`

**6. Atualizar tipos e hooks**
- Atualizar `useArtistGorjetas` e queries relevantes para incluir `estabelecimento_id`
- A notificação ao estabelecimento usará o trigger existente `criar_notificacao` via RPC

### Resumo de arquivos afetados
- **Migração SQL**: Adicionar `estabelecimento_id` em `gorjetas`, `mostrar_gorjetas_local` em `profiles`, nova RLS policy
- **`src/pages/EstabelecimentoProfile.tsx`**: Inserir pedidos em `pedidos` em vez de `pedidos_estabelecimento`
- **`src/components/TwoStepPixPaymentDialog.tsx`**: Aceitar e usar `estabelecimentoId`
- **`src/pages/EstabelecimentoPanel.tsx`**: Mostrar feed de atividades + gorjetas em vez de pedidos gerenciáveis
- **`src/pages/Settings.tsx`**: Toggle de visibilidade de gorjetas para o local

