

# Migrar de Mercado Pago para Stripe

## Resumo

Remover completamente o Mercado Pago como processador de pagamentos e substituir pelo Stripe, que tem integração nativa com o Lovable. Isso simplifica o código, melhora a experiência do artista (sem OAuth complexo, sem retenção de 14 dias) e mantém o modelo de monetização (20% taxa Free, 0% PRO).

## O que muda

### Pagamentos de Gorjetas (Free)
- **Antes:** Mercado Pago SDK gerando PIX e processando cartão, com OAuth para vincular conta do artista
- **Depois:** Stripe Checkout gerando sessão de pagamento (PIX + cartão), com split automático via Stripe Connect

### Assinaturas PRO
- **Antes:** PIX via Mercado Pago para pagar assinatura
- **Depois:** Stripe Checkout com recorrência (cartão/boleto)

### PIX Direto (PRO)
- **Sem alteração** - O PIX direto do artista PRO (DirectPixPaymentDialog) nao usa Mercado Pago, funciona independente

## Etapas de Implementacao

### 1. Habilitar Stripe
- Ativar a integração nativa do Lovable com Stripe
- Configurar a secret key do Stripe

### 2. Remover dependencias do Mercado Pago
- Remover pacote `@mercadopago/sdk-react`
- Remover `src/config/mercadopago.ts`
- Remover `src/hooks/useMercadoPago.tsx`
- Remover `src/components/CardPaymentForm.tsx`
- Remover `src/components/MercadoPagoLink.tsx` (artistas nao precisam mais vincular conta)

### 3. Reescrever Edge Functions
- **Remover:** `mercadopago-oauth-callback`, `mercadopago-webhook`, `process-card-payment`, `create-pix-payment`
- **Criar:** `create-stripe-checkout` (gorjetas via Stripe Checkout)
- **Criar:** `stripe-webhook` (processar callbacks do Stripe)
- **Reescrever:** `create-subscription` (usar Stripe para assinaturas)
- **Reescrever:** `subscription-webhook` (usar eventos do Stripe)
- **Manter:** `check-payment-status` (adaptar para Stripe)

### 4. Atualizar componentes de pagamento
- Reescrever `TipPaymentDialog` para redirecionar ao Stripe Checkout
- Remover tabs PIX/Cartao (Stripe cuida disso automaticamente)
- Simplificar fluxo: cliente clica "Pagar" -> Stripe Checkout -> retorno

### 5. Atualizar banco de dados
- Tabela `artist_mercadopago_credentials` pode ser removida (ou mantida vazia)
- Atualizar referências nas funcoes do banco (ex: `has_mercadopago_linked`)
- Campo `payment_id` em `gorjetas` passa a armazenar Stripe payment ID

### 6. Atualizar textos e UI
- Remover todas as mencoes a "Mercado Pago" no app
- Atualizar FAQ da landing page
- Atualizar Settings do artista (remover secao de vincular MP)
- Atualizar ArtistPanel (remover acordeao do MP)

## Detalhes Tecnicos

### Stripe Checkout para Gorjetas
O fluxo sera:
1. Cliente escolhe valor no perfil do artista
2. Frontend chama edge function `create-stripe-checkout`
3. Edge function cria sessao Stripe com `application_fee_amount` (20% para Free, 0% para PRO)
4. Cliente e redirecionado ao Stripe Checkout (aceita PIX, cartao, boleto)
5. Webhook `stripe-webhook` confirma pagamento e atualiza `gorjetas`

### Stripe Connect para Artistas
- Em vez de OAuth do Mercado Pago, usar Stripe Connect (Standard ou Express)
- Artista vincula conta Stripe uma vez, recebe automaticamente
- Sem retencao de 14 dias — Stripe libera em 2 dias uteis

### Impacto no modelo de receita
- Free: 20% application_fee no Stripe (mesmo modelo)
- PRO: 0% application_fee (artista recebe tudo)
- Assinaturas: cobradas diretamente via Stripe

## Riscos e consideracoes
- Artistas que ja usam Mercado Pago precisarao vincular conta Stripe
- Gorjetas pendentes no MP precisam ser finalizadas antes da migracao
- Stripe cobra ~3.49% + R$ 0.39 por transacao PIX (vs ~0.99% do MP) - custo maior para o artista
- Stripe Connect requer verificacao KYC do artista

## Ordem de execucao
1. Habilitar Stripe e configurar keys
2. Criar edge functions novas (checkout + webhook)
3. Atualizar frontend (dialogs de pagamento)
4. Atualizar assinaturas para Stripe
5. Remover todo codigo do Mercado Pago
6. Atualizar textos e landing page
