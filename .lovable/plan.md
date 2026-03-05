

## Problema

Os botões CTA fora da seção de preços (Hero, Calculadora, CTA Final, CTA Mobile Sticky) chamam `handleCTAClick()` diretamente, que vai direto para o Stripe sem mostrar a opção de escolher entre Cartão e PIX. Apenas os botões dentro da `PricingSection` mostram o `PaymentMethodDialog`.

## Solução

Mover a lógica de seleção de forma de pagamento para o nível do `ProSales.tsx`, para que **todos** os CTAs passem pelo `PaymentMethodDialog`.

### Mudanças em `src/pages/ProSales.tsx`:

1. Adicionar estados para o `PaymentMethodDialog` e `PixSubscriptionDialog`
2. Modificar `handleCTAClick` para abrir o `PaymentMethodDialog` em vez de ir direto ao Stripe
3. Separar a lógica de checkout do Stripe em `handleCardPayment`
4. Adicionar `handlePixPayment` para abrir o `PixSubscriptionDialog`
5. Renderizar os dois dialogs no JSX

### Mudanças em `src/components/sales/PricingSection.tsx`:

1. Remover os estados e lógica do `PaymentMethodDialog` e `PixSubscriptionDialog` (movidos para ProSales)
2. Manter apenas os botões que chamam `onCTAClick(priceId)` como antes

### Fluxo resultante:

Qualquer CTA clicado → verifica auth → abre `PaymentMethodDialog` → usuário escolhe Cartão (Stripe) ou PIX (dialog manual com QR code e upload de comprovante).

