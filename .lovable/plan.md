

## Problema

Quando o usuário cancela o checkout no Stripe, ele volta para `/pro?checkout=cancelled`. A página carrega normalmente mas não dá nenhum feedback ao usuário e não faz scroll para a seção de preços, dificultando a escolha de outro plano.

## Plano

### 1. Detectar `?checkout=cancelled` e mostrar feedback + scroll para preços

No `ProSales.tsx`, adicionar um `useEffect` que:
- Detecta `searchParams.get("checkout") === "cancelled"`
- Mostra um toast informando que o checkout foi cancelado e que ele pode escolher outro plano
- Faz scroll automático para a seção de preços (`PricingSection`)

### 2. Adicionar `id` na seção de preços

No `PricingSection.tsx`, adicionar `id="pricing"` na `<section>` para permitir o scroll programático.

### Resultado esperado

Usuário cancela no Stripe → volta para `/pro?checkout=cancelled` → vê um toast "Checkout cancelado. Escolha um plano abaixo." → página faz scroll suave até a seção de preços com os 3 planos disponíveis.

