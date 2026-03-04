

## Diagnóstico

O usuário está na rota `/` que renderiza **Index.tsx**. Essa página usa o `PremiumOfferModal` mas **não possui** o `AuthRequiredDialog`. Ao selecionar um plano, navega direto para `/auth?upgrade=true` sem mostrar o aviso.

O `AuthRequiredDialog` foi adicionado apenas em:
- `Landing.tsx` (/landing) ✅
- `ProSales.tsx` (/pro) ✅
- **Index.tsx (/) ❌ — FALTOU**

## Plano

### 1. Adicionar `AuthRequiredDialog` ao `Index.tsx`
- Importar `AuthRequiredDialog`
- Adicionar estado `showAuthDialog`
- Modificar `handleSelectPlan`: em vez de navegar direto, fechar o PremiumOfferModal e abrir o AuthRequiredDialog
- Adicionar o componente `<AuthRequiredDialog>` no JSX
- No `onConfirm`, navegar para `/auth?upgrade=true`

### 2. Verificar o botão "Continuar para login" no `PremiumOfferModal`
- Esse botão já diz explicitamente "Continuar para login", então o aviso não é necessário nesse caminho — o usuário já entende que vai para o login.
- Manter comportamento atual (navegação direta para `/auth`).

### Resultado esperado
Em **todas** as telas onde há botão "Assinar PRO" (Index `/`, Landing `/landing`, ProSales `/pro`), o `AuthRequiredDialog` aparecerá antes de redirecionar para o cadastro/login.

