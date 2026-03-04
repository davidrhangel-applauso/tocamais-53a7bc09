

## Problema

O fluxo de seleção de plano perde a informação do plano escolhido em dois pontos:

1. **Auth.tsx**: Após login/cadastro com `?upgrade=true&plan=monthly`, redireciona para `/pro` **sem preservar o parâmetro `plan`**.
2. **ProSales.tsx**: Ao chegar na página `/pro`, se o usuário está autenticado, não lê nenhum parâmetro da URL. Quando os CTAs genéricos (Hero, FAQ, etc.) chamam `handleCTAClick()` sem `priceId`, o código faz fallback para `STRIPE_PLANS.anual.price_id`.

Resultado: independentemente do plano selecionado, o Stripe sempre recebe o `price_id` do plano anual.

## Plano

### 1. Auth.tsx — Preservar o parâmetro `plan` no redirect

Após login/signup, ao redirecionar para `/pro`, incluir o parâmetro `plan`:
```
navigate(`/pro${plan ? `?plan=${plan}` : ''}`)
```

### 2. ProSales.tsx — Ler `plan` da URL e iniciar checkout automaticamente

- Ler `searchParams.get("plan")` da URL
- Mapear `"monthly"` → `"mensal"`, `"annual"` → `"anual"`, `"biennial"` → `"bienal"`
- Se o usuário está autenticado E há um `plan` na URL, iniciar o checkout automaticamente com o `price_id` correto ao carregar a página
- Manter o fallback para anual nos CTAs genéricos

### 3. Index.tsx e Landing.tsx — Já passam o plan na URL (OK)

Esses já estão corretos: `navigate(/auth?upgrade=true&plan=${pendingPlan})`.

### Resultado esperado

Usuário seleciona "Mensal" → faz login → é redirecionado para `/pro?plan=monthly` → checkout abre automaticamente com o price_id mensal correto.

