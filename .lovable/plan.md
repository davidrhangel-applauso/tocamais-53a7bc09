

## Diagnóstico

Encontrei o bug. O parâmetro `plan` está sendo perdido em **dois lugares**:

### 1. `Landing.tsx` linha 132
```typescript
onConfirm={() => navigate("/auth?upgrade=true")}  // ❌ Falta o plan
```
O `pendingPlan` é salvo no estado mas **nunca é incluído na URL** do AuthRequiredDialog.

### 2. `ProSales.tsx` linha 113
```typescript
onConfirm={() => navigate("/auth?upgrade=true")}  // ❌ Falta o plan
```
Quando um usuário não autenticado clica em "Assinar Mensal", `handleCTAClick` abre o AuthRequiredDialog, mas **não armazena qual plano foi selecionado**. O dialog sempre navega sem o parâmetro `plan`, então Auth.tsx redireciona para `/pro` sem plan, e o auto-checkout usa o fallback anual.

**Nota:** `Index.tsx` está correto — já passa `pendingPlan` na URL.

## Plano

### 1. Corrigir `Landing.tsx`
- Linha 132: Incluir `pendingPlan` na URL do `onConfirm`:
  ```typescript
  onConfirm={() => navigate(`/auth?upgrade=true${pendingPlan ? `&plan=${pendingPlan}` : ''}`)}
  ```

### 2. Corrigir `ProSales.tsx`
- Adicionar estado `pendingPlanKey` para armazenar o plano selecionado
- Em `handleCTAClick`, ao mostrar o dialog (usuário não autenticado), salvar o plano correspondente ao `priceId`
- No `onConfirm` do AuthRequiredDialog, incluir o plano na URL:
  ```typescript
  onConfirm={() => navigate(`/auth?upgrade=true${pendingPlanKey ? `&plan=${pendingPlanKey}` : ''}`)}
  ```
- Mapear `priceId` → nome do plano em inglês (`monthly`, `annual`, `biennial`) para a URL

