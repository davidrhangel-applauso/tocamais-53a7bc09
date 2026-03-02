

## Problema Identificado

As edge functions `create-checkout`, `check-subscription` e `customer-portal` **não estão registradas no `supabase/config.toml`**. Sem essa configuração, as funções não são deployadas e as chamadas do frontend falham silenciosamente.

## Plano

### Passo único: Registrar as 3 edge functions no `supabase/config.toml`

Adicionar as seguintes entradas ao final do arquivo:

```toml
[functions.create-checkout]
verify_jwt = false

[functions.check-subscription]
verify_jwt = false

[functions.customer-portal]
verify_jwt = false
```

Isso fará o deploy automático das funções que já existem em `supabase/functions/`. Após isso, o botão de assinatura deve redirecionar corretamente para o Stripe Checkout.

