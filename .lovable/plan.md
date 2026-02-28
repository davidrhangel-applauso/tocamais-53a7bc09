

## Integrar Stripe para Assinaturas PRO

O fluxo atual usa PIX manual com upload de comprovante e aprovação do admin. Vamos substituir por Stripe Checkout com 3 planos (Mensal, Anual, Bienal).

### Passo 1: Criar produtos e preços no Stripe

Usar as ferramentas do Stripe para criar 3 produtos com preços recorrentes:
- PRO Mensal: R$ 19,90/mês
- PRO Anual: R$ 99,00/ano
- PRO Bienal: R$ 169,90 a cada 2 anos

### Passo 2: Criar edge function `create-checkout`

Nova função em `supabase/functions/create-checkout/index.ts`:
- Recebe `price_id` do frontend
- Autentica o usuário via token
- Verifica/cria customer no Stripe pelo email
- Cria sessão de checkout com `mode: "subscription"`
- Retorna URL do checkout

### Passo 3: Criar edge function `check-subscription`

Nova função em `supabase/functions/check-subscription/index.ts`:
- Autentica o usuário
- Busca customer no Stripe pelo email
- Verifica assinaturas ativas
- Retorna `{ subscribed, product_id, subscription_end }`

### Passo 4: Criar edge function `customer-portal`

Nova função em `supabase/functions/customer-portal/index.ts`:
- Cria sessão do Stripe Customer Portal
- Permite cancelamento e troca de plano

### Passo 5: Atualizar `SubscriptionCard.tsx`

- Remover fluxo de PIX manual + upload de comprovante
- Adicionar seleção de plano (Mensal/Anual/Bienal)
- Botão que invoca `create-checkout` e redireciona para Stripe
- Para PRO ativo: botão "Gerenciar Assinatura" via customer-portal
- Manter visual atual de comparação Free vs Pro

### Passo 6: Atualizar `useSubscription.tsx`

- Adicionar chamada a `check-subscription` para validar status via Stripe
- Manter fallback do banco local (admin-granted PRO)

### Passo 7: Atualizar `ProSales.tsx`

- Ao clicar no CTA, se autenticado: invocar `create-checkout` direto com o plano selecionado (ao invés de abrir modal com PIX)
- Se não autenticado: redirecionar para `/auth?upgrade=true`

### Passo 8: Atualizar `PricingSection.tsx`

- Cada botão de plano passa o `price_id` correspondente
- Callback `onCTAClick` recebe o `price_id` como parâmetro

### Passo 9: Atualizar `PaymentFAQ.tsx`

- Remover referências ao Mercado Pago
- Atualizar textos para refletir pagamento via Stripe (cartão de crédito)

### Passo 10: Registrar novas funções no `supabase/config.toml`

Adicionar entradas para `create-checkout`, `check-subscription` e `customer-portal` com `verify_jwt = false`.

---

### Detalhes técnicos

- `STRIPE_SECRET_KEY` já está configurado nos secrets
- Os `price_id` e `product_id` do Stripe serão hardcoded no frontend após criação
- O fluxo de PIX direto para gorjetas **não muda** — continua como está
- A edge function `create-subscription` (Mercado Pago) será mantida mas não mais usada
- A edge function `create-manual-subscription` será mantida mas não mais usada

