

## Plano: Remover completamente o Mercado Pago do projeto

### Resumo

O Mercado Pago não é mais utilizado. Toda integração será removida: edge functions, tabela de credenciais, funções SQL, secrets, arquivos de documentação e referências no código.

### Mudanças

| Área | O que remover/alterar |
|---|---|
| **Edge functions (deletar)** | `create-subscription/index.ts` — cria pagamento PIX via MP |
| **Edge functions (deletar)** | `subscription-webhook/index.ts` — webhook de pagamento MP |
| **`supabase/config.toml`** | Remover entries: `mercadopago-webhook`, `mercadopago-oauth-callback`, `check-payment-status`, `create-pix-payment`, `process-card-payment`, `create-subscription`, `subscription-webhook` |
| **Migração SQL** | `DROP TABLE public.artist_mercadopago_credentials CASCADE;` |
| **Migração SQL** | `DROP FUNCTION public.get_artist_mercadopago_seller_id;` |
| **Migração SQL** | `DROP FUNCTION public.has_mercadopago_linked;` |
| **Migração SQL** | Remover colunas `mercadopago_*` da tabela `profiles` (se ainda existirem) |
| **`src/pages/Admin.tsx`** | Remover linha que deleta `artist_mercadopago_credentials` no fluxo de deletar artista |
| **Arquivos (deletar)** | `MERCADOPAGO_SETUP.md` |
| **`PRODUCTION_CHECKLIST.md`** | Remover todas referências a Mercado Pago |
| **Secrets** | Remover: `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_CLIENT_ID`, `MERCADO_PAGO_CLIENT_SECRET`, `MERCADO_PAGO_WEBHOOK_SECRET`, `VITE_MERCADO_PAGO_CLIENT_ID` |

### Nota

O `types.ts` será atualizado automaticamente após a migração SQL — não é editado manualmente.

