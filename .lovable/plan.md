

## Plano: Preços dinâmicos do admin_settings em toda a aplicação

### Problema

Os preços dos planos estão hardcoded em ~10 arquivos diferentes. Quando o admin altera os valores em Configurações, nada muda na interface.

### Solução

Criar um hook `useAdminPrices` que busca os preços do `admin_settings` (público, sem auth) e usar em todos os componentes que exibem preços. Para a landing page (usuários não autenticados), precisamos de uma RLS policy que permita leitura pública das settings de preço.

### Mudanças

| Arquivo | Mudança |
|---|---|
| **Migração SQL** | Adicionar RLS policy permitindo SELECT público nas settings com prefixo `subscription_price_` |
| **`src/hooks/useAdminPrices.ts`** (novo) | Hook que busca `subscription_price_mensal/anual/bienal` do `admin_settings` e retorna os preços (com fallback para valores padrão de `stripe-plans.ts`) |
| **`src/lib/stripe-plans.ts`** | Exportar os preços padrão separadamente para uso como fallback |
| **`src/components/landing/PricingCards.tsx`** | Usar `useAdminPrices` em vez de preços hardcoded |
| **`src/components/PremiumOfferModal.tsx`** | Usar `useAdminPrices` |
| **`src/components/landing/PlanComparison.tsx`** | Usar preço dinâmico no texto "A partir de R$ X/mês" |
| **`src/components/sales/SavingsCalculator.tsx`** | Usar `proMonthlyPrice` do hook |
| **`src/components/sales/PricingSection.tsx`** | Usar `useAdminPrices` |
| **`src/components/sales/StickyMobileCTA.tsx`** | Usar preço dinâmico no texto |
| **`src/components/sales/FinalCTA.tsx`** | Usar preço dinâmico no texto |
| **`src/components/sales/ComparisonSection.tsx`** | Usar preço dinâmico |
| **`src/components/SubscriptionCard.tsx`** | Usar `useAdminPrices` para exibir preços corretos |
| **`src/components/PaymentMethodDialog.tsx`** | Usar preços dinâmicos nos cards de plano |
| **`src/components/PaymentFAQ.tsx`** | Usar preços dinâmicos no texto do FAQ |

### Hook `useAdminPrices`

```typescript
// Busca preços do admin_settings, retorna { mensal, anual, bienal, isLoading }
// Fallback para valores padrão se não configurados
// Cache via React Query com staleTime longo (5 min)
```

### RLS

Necessária uma policy pública de SELECT no `admin_settings` para keys de preço, já que a landing page é acessada por usuários não autenticados:

```sql
CREATE POLICY "Anyone can view subscription prices"
ON public.admin_settings FOR SELECT
USING (setting_key LIKE 'subscription_price_%');
```

### Cálculos derivados

O hook também calculará valores derivados:
- `monthlyEquivalent` para anual e bienal (preço / meses)
- `savings` comparado ao mensal (ex: `mensal * 12 - anual`)

