

## Ajustes Finos Identificados

Analisando o código, encontrei os seguintes problemas que precisam de correção:

### 1. Preços duplicados e desincronizados

O `AdminSettings.tsx` salva preços por plano (`subscription_price_mensal`, `subscription_price_anual`, `subscription_price_bienal`), mas a edge function `create-manual-subscription` lê apenas `subscription_price` (campo único antigo). Além disso, o `PixSubscriptionDialog` usa preços hardcoded de `stripe-plans.ts` em vez dos valores configurados pelo admin.

**Correção:**
- Atualizar a edge function para receber o `planKey` e buscar o preço correto (`subscription_price_mensal`, etc.)
- O `PixSubscriptionDialog` já passa `plan.price` para o QR Code, mas deveria idealmente usar o preço do admin_settings

### 2. Configurações PIX duplicadas no admin

O `AdminSubscriptions.tsx` ainda tem uma aba "Configurar Pix" (linhas 287-290, 399-466) com campos antigos que agora é redundante com o novo `AdminSettings.tsx`. Isso confunde o admin com dois lugares para configurar a mesma coisa.

**Correção:** Remover a aba "Configurar Pix" do `AdminSubscriptions.tsx`, deixando apenas a aba "Comprovantes".

### 3. Status `rejected` inválido no banco

O `AdminSubscriptions.tsx` (linha 233) tenta atualizar o status da assinatura para `rejected`, mas o constraint do banco só aceita: `active`, `cancelled`, `expired`, `pending`. Isso causa erro silencioso ao rejeitar um comprovante.

**Correção:** Migração para adicionar `rejected` ao constraint, ou usar `cancelled` em vez de `rejected`.

### 4. `planKey` não enviado à edge function

O `PixSubscriptionDialog` chama `create-manual-subscription` sem enviar o `planKey`. A edge function não sabe qual plano foi escolhido, então sempre usa o preço padrão.

**Correção:** Enviar `planKey` no body da chamada e a edge function usar `subscription_price_{planKey}` da tabela `admin_settings`.

---

### Resumo das mudanças

| Arquivo | Mudança |
|---|---|
| **Migração SQL** | Adicionar `rejected` ao constraint `artist_subscriptions_status_check` |
| **`create-manual-subscription/index.ts`** | Receber `plan_key`, buscar preço específico do plano no admin_settings |
| **`PixSubscriptionDialog.tsx`** | Enviar `planKey` na chamada da edge function |
| **`AdminSubscriptions.tsx`** | Remover aba "Configurar Pix" (redundante com AdminSettings), manter apenas "Comprovantes" |

