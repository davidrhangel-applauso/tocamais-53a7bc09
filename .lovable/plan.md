

## Plano: Assinatura PIX com aprovação manual + timer + auto-expiração

### Contexto atual

O projeto **já possui** infraestrutura parcial para isso:
- Tabela `subscription_receipts` para comprovantes
- Tabela `artist_subscriptions` com `starts_at`/`ends_at`
- `AdminSubscriptions` com fluxo de aprovação/rejeição de comprovantes
- Admin settings para configurar chave PIX
- `useSubscription` hook com `daysRemaining`

### O que falta implementar

---

### 1. Fluxo de pagamento PIX para o usuário (frontend)

**Onde:** `PricingSection.tsx` e novo componente `PixSubscriptionDialog.tsx`

- Adicionar botão "Pagar via PIX" ao lado de cada plano na `PricingSection`
- Criar dialog `PixSubscriptionDialog` que:
  - Busca configurações PIX do admin (`admin_settings`)
  - Gera QR Code dinâmico com o valor do plano selecionado (usando `pix-qr-generator.ts` existente)
  - Exibe código "copia e cola"
  - Permite upload de comprovante (usando bucket `receipts`)
  - Ao enviar: cria registro em `artist_subscriptions` (status `pending`) e `subscription_receipts` (status `pending`)
  - Mostra mensagem: "Pagamento enviado! Em até 24h seu plano PRO será ativado."

**Onde mais:** `SubscriptionCard.tsx` - adicionar opção PIX para quem está no painel

---

### 2. Notificação por email ao admin

**Onde:** Nova edge function `notify-admin-subscription`

- Disparada após criação do comprovante
- Envia notificação in-app ao admin (via `criar_notificacao` RPC)
- Para email: usar uma edge function simples que busca o email do admin e envia via Lovable AI (ou simplesmente criar notificação in-app, já que email externo requer configuração adicional)

**Alternativa mais simples:** Usar apenas a notificação in-app existente (`criar_notificacao`) para o admin, que já tem o `NotificationBell` no dashboard.

---

### 3. Timer de dias restantes visível no admin

**Onde:** `Admin.tsx` na tabela de artistas

- Adicionar coluna "Assinatura" na tabela de artistas
- Buscar `artist_subscriptions` ativas para cada artista PRO
- Exibir dias restantes com badge colorida (verde > 15 dias, amarelo 5-15, vermelho < 5)
- Exibir "Expirado" se `ends_at` já passou

---

### 4. Auto-expiração de assinaturas

**Onde:** Nova edge function `expire-subscriptions` (cron job)

- Executada periodicamente (pode ser invocada via cron externo ou chamada do admin)
- Busca `artist_subscriptions` com `status = 'active'` e `ends_at < now()`
- Atualiza status para `expired`
- Atualiza `profiles.plano` para `free`
- Cria notificação para o artista informando expiração

**Alternativa com DB:** Criar função PostgreSQL + trigger ou usar a `check-subscription` existente para verificar e downgrade automaticamente quando o artista acessa a plataforma.

---

### 5. Ajustes na duração por plano

Ao aprovar comprovante PIX, o admin já define 30 dias fixos. Precisamos:
- Passar a duração correta baseada no plano: Mensal (30 dias), Anual (365 dias), Bienal (730 dias)
- Armazenar qual plano foi contratado no `artist_subscriptions`

---

### Resumo das mudanças

| Componente | Mudança |
|---|---|
| `PixSubscriptionDialog.tsx` (novo) | Dialog com QR PIX + upload comprovante |
| `PricingSection.tsx` | Botão "Pagar via PIX" em cada plano |
| `SubscriptionCard.tsx` | Opção PIX no painel do artista |
| `AdminSubscriptions.tsx` | Exibir plano contratado + duração correta na aprovação |
| `Admin.tsx` (tab artists) | Coluna de dias restantes da assinatura |
| `expire-subscriptions` (edge function) | Auto-expiração de assinaturas vencidas |
| Migração DB | Adicionar coluna `plano_tipo` em `artist_subscriptions` para saber qual plano (mensal/anual/bienal) |

### Migração SQL

```sql
ALTER TABLE artist_subscriptions ADD COLUMN IF NOT EXISTS plano_tipo text DEFAULT 'mensal';
```

