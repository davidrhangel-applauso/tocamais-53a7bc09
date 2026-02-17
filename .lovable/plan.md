
## Limite de Gorjetas para Artistas Free (R$ 10)

### Resumo
Permitir que artistas Free recebam gorjetas normalmente ate atingir R$ 10 acumulados (valor liquido). Apos esse limite, bloquear novos pagamentos e exibir uma notificacao/modal convidando o artista a assinar o plano PRO. O cliente que tenta enviar gorjeta para um artista Free que atingiu o limite tambem sera informado.

### Como funciona

```text
Cliente envia gorjeta
        |
        v
Edge Function verifica:
  - Artista e PRO? -> Processa normalmente
  - Artista e Free? -> Consulta total acumulado aprovado
        |
        v
  Total < R$10? -> Processa com taxa de 20%
  Total >= R$10? -> Rejeita com erro "limite_free_atingido"
        |
        v
  Notificacao automatica para o artista
  + Modal no painel do artista
```

### Mudancas necessarias

#### 1. Funcao no banco de dados: `get_artist_approved_total`
Criar uma funcao SQL que retorna o total de gorjetas aprovadas (valor liquido) de um artista. Sera usada pelas Edge Functions para verificar o limite rapidamente.

```sql
CREATE FUNCTION get_artist_approved_total(artist_id uuid) RETURNS numeric
-- Soma valor_liquido_artista de gorjetas com status_pagamento = 'approved'
```

#### 2. Edge Functions: `create-pix-payment` e `process-card-payment`
Adicionar verificacao **antes** de criar o pagamento no Mercado Pago:
- Se o artista NAO e PRO, consultar `get_artist_approved_total`
- Se o total + novo valor liquido ultrapassar R$ 10, retornar erro especifico `FREE_LIMIT_REACHED`
- Disparar notificacao via `criar_notificacao()` avisando o artista

#### 3. Novo componente: `FreeLimitReachedModal`
Modal exibido no painel do artista quando ele atinge o limite. Mostra:
- Mensagem "Voce atingiu o limite de R$ 10 em gorjetas gratuitas"
- Beneficios do PRO (0% taxa, PIX direto, etc.)
- Botao "Assinar PRO Agora" que redireciona para `/pro-sales`
- Botao "Ver detalhes" secundario

#### 4. Hook: `useFreeTipLimit`
Novo hook que:
- Consulta o total de gorjetas aprovadas do artista Free
- Calcula quanto falta para atingir o limite
- Retorna `{ totalReceived, limitReached, remainingAmount }`
- Sera usado no `ArtistPanel` para exibir barra de progresso e modal

#### 5. Painel do Artista (`ArtistPanel.tsx`)
- Adicionar barra de progresso "R$ X / R$ 10,00 do limite gratuito" para artistas Free
- Quando `limitReached = true`, exibir banner/modal com CTA para assinar PRO
- Notificacao em tempo real quando o limite e atingido (via canal de notificacoes existente)

#### 6. Perfil do Artista (`ArtistProfile.tsx`) - lado do cliente
- Quando o erro `FREE_LIMIT_REACHED` e retornado pela Edge Function, exibir mensagem amigavel ao cliente:
  "Este artista atingiu o limite de gorjetas do plano gratuito. Ele foi notificado para ativar o plano PRO."
- Desabilitar o botao de gorjeta para esse artista ate ele virar PRO

#### 7. Notificacao automatica
- Usar a funcao `criar_notificacao()` existente na Edge Function para enviar notificacao ao artista quando o limite e atingido
- Tipo: `limite_free_atingido`
- Link: `/pro-sales`
- Mensagem: "Voce atingiu o limite de R$ 10 em gorjetas gratuitas! Assine o PRO para continuar recebendo."

### Detalhes Tecnicos

**Arquivos a criar:**
- `src/hooks/useFreeTipLimit.ts` - Hook para consultar limite
- `src/components/FreeLimitReachedModal.tsx` - Modal de upgrade

**Arquivos a modificar:**
- `supabase/functions/create-pix-payment/index.ts` - Adicionar verificacao de limite
- `supabase/functions/process-card-payment/index.ts` - Adicionar verificacao de limite
- `src/pages/ArtistPanel.tsx` - Barra de progresso + modal
- `src/pages/ArtistProfile.tsx` - Tratamento do erro no lado do cliente
- `src/components/TipPaymentDialog.tsx` - Tratamento do erro

**Migracao SQL:**
- Criar funcao `get_artist_approved_total(artist_id uuid)`

**Constante de limite:** R$ 10,00 definida como constante tanto nas Edge Functions quanto no frontend para facil ajuste futuro.
