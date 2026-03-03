

## Problema

O `AuthRequiredDialog` no `ProSales.tsx` parece não estar aparecendo corretamente. Além disso, a Landing page não utiliza o `AuthRequiredDialog` — ela usa o `PremiumOfferModal` que redireciona direto para `/auth?upgrade=true` sem aviso.

## Plano

### 1. Landing.tsx — Adicionar AuthRequiredDialog

A Landing page já redireciona usuários autenticados para seus painéis, então todos os usuários nela são não-autenticados. Atualmente, ao selecionar um plano no `PremiumOfferModal`, navega direto para `/auth?upgrade=true`. 

**Mudança:** Após o usuário selecionar um plano no PremiumOfferModal, ao invés de navegar diretamente, abrir o `AuthRequiredDialog`. Só ao confirmar no dialog é que navega para `/auth?upgrade=true`.

- Adicionar estado `showAuthDialog`
- Modificar `handleSelectPlan` para abrir o AuthRequiredDialog em vez de navegar
- Adicionar `<AuthRequiredDialog>` ao JSX

### 2. ProSales.tsx — Verificar e corrigir o dialog

O código parece correto, mas vou garantir que:
- O dialog não está sendo fechado por algum conflito de estado
- O `onOpenChange` não chama `onConfirm` imediatamente ao abrir

**Possível bug:** O `AuthRequiredDialog` atual chama `handleClose` (que navega) quando `onOpenChange` recebe `false`. Mas se o Dialog do Radix disparar `onOpenChange(false)` logo após abrir (por algum conflito de foco), o dialog fecha e navega instantaneamente. Vou adicionar um guarda para evitar isso — só navegar quando o usuário clicar no botão, não ao fechar o overlay.

### 3. Corrigir AuthRequiredDialog

Separar a ação de fechar da ação de navegar:
- Fechar pelo X ou overlay: apenas fecha o dialog, **sem navegar**
- Clicar no botão "Ir para Login/Cadastro": fecha e navega

Isso evita redirecionamento involuntário e garante que o dialog fique visível até o usuário tomar uma ação.

