

## Plano: Sincronizar preços do admin com o Stripe automaticamente

### Contexto

Sim, é possível. Quando o admin salvar novos preços nas configurações, o sistema pode criar automaticamente um novo **Price** no Stripe (vinculado ao mesmo Product) com o valor atualizado, e salvar o novo `price_id` no `admin_settings`. O checkout então usará o `price_id` dinâmico em vez do hardcoded.

No Stripe, um Product pode ter múltiplos Prices. O price antigo continua existindo (assinaturas ativas não são afetadas), mas novos checkouts usam o price atualizado.

### Mudanças

| Arquivo | Mudança |
|---|---|
| **Nova edge function `sync-stripe-prices/index.ts`** | Recebe `plan_key` e `price` (em centavos BRL). Cria um novo Price no Stripe vinculado ao Product existente, desativa o price antigo, e salva o novo `price_id` no `admin_settings` |
| **`admin_settings`** | Adicionar 3 novas keys: `stripe_price_id_mensal`, `stripe_price_id_anual`, `stripe_price_id_bienal` para armazenar os price_ids dinâmicos |
| **`src/components/AdminSettings.tsx`** | Ao salvar preços, chamar a edge function `sync-stripe-prices` para cada plano cujo preço foi alterado |
| **`supabase/functions/create-checkout/index.ts`** | Em vez de receber `price_id` do frontend, receber `plan_key` e buscar o `price_id` atualizado do `admin_settings` (com fallback para os IDs hardcoded de `stripe-plans.ts`) |

### Fluxo

```text
Admin altera preço → Salva no admin_settings
                   → Chama sync-stripe-prices
                   → Edge function cria novo Price no Stripe (mesmo Product)
                   → Salva novo price_id no admin_settings
                   → Próximo checkout usa o price_id atualizado
```

### Edge function `sync-stripe-prices`

```text
Input: { plan_key: "mensal", price: 29.90 }

1. Busca product_id do plano (mapeamento fixo no código)
2. Cria stripe.prices.create({ product: product_id, unit_amount: 2990, currency: "brl", recurring: { interval } })
3. Desativa o price antigo via stripe.prices.update(old_price_id, { active: false })
4. Salva novo price_id em admin_settings como stripe_price_id_mensal
```

### Intervalos por plano

- **mensal**: `{ interval: "month" }`
- **anual**: `{ interval: "year" }`
- **bienal**: `{ interval: "year", interval_count: 2 }`

### Segurança

A edge function valida que o usuário autenticado é admin antes de executar qualquer operação no Stripe.

