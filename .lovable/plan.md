

## Habilitar PIX no Stripe Checkout

### Problema
A edge function `create-stripe-checkout` esta configurada com `payment_method_types: ['card']`, o que limita o pagamento apenas a cartao de credito/debito. O PIX nao aparece como opcao.

### Solucao
Adicionar `'pix'` na lista de metodos de pagamento aceitos na edge function.

### Detalhe tecnico

**Arquivo:** `supabase/functions/create-stripe-checkout/index.ts`

Alterar a linha 152 de:
```typescript
payment_method_types: ['card'],
```
Para:
```typescript
payment_method_types: ['card', 'pix'],
```

Isso fara com que o Stripe Checkout exiba automaticamente as opcoes de cartao e PIX para o cliente na tela de pagamento.

**Nenhuma outra alteracao necessaria** - o Stripe cuida de gerar o QR Code PIX e confirmar o pagamento automaticamente via webhook.

### Observacao
O Stripe cobra taxas diferentes por metodo: cartao ~3.99% + R$0.39 e PIX ~0.99% + R$0.10. O PIX e significativamente mais barato para os clientes.
