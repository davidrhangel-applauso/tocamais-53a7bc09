

## Problema

Há dois problemas no fluxo atual:

1. **Edge function `create-checkout` quebra quando não há token de auth** — a linha `req.headers.get("Authorization")!` retorna `null` e `.replace()` falha com o erro `Cannot read properties of null (reading 'replace')`.

2. **Após cadastro com verificação de email obrigatória**, o usuário é redirecionado para `/pro` mas **não está autenticado** (precisa confirmar o email primeiro). Ao clicar em "Assinar", é enviado de volta para `/auth?upgrade=true` em loop.

## Plano

### 1. Corrigir a edge function `create-checkout`
- Adicionar validação segura do header `Authorization` — retornar erro 401 claro se ausente, em vez de quebrar com erro genérico.

### 2. Melhorar o fluxo de cadastro + assinatura no `Auth.tsx`
- Após cadastro bem-sucedido, se `upgrade=true` e o email ainda não foi confirmado, exibir uma mensagem clara: **"Verifique seu email para confirmar a conta e depois volte aqui para assinar o PRO"**, em vez de redirecionar silenciosamente para `/pro` onde o botão não funciona.

### 3. Melhorar feedback na página `/pro` (ProSales.tsx)
- Quando o usuário clica para assinar e não está autenticado, exibir um **toast informativo** antes de redirecionar, explicando que precisa fazer login primeiro.
- Se a chamada ao `create-checkout` falhar, mostrar a mensagem de erro específica ao invés de genérica.

### Detalhes técnicos

**`supabase/functions/create-checkout/index.ts`** — linha 21:
```typescript
// Antes:
const authHeader = req.headers.get("Authorization")!;
// Depois:
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(JSON.stringify({ error: "Not authenticated" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 401,
  });
}
```

**`src/pages/Auth.tsx`** — no `handleSignUp`, verificar se o usuário foi confirmado automaticamente ou precisa confirmar email antes de redirecionar para `/pro`.

**`src/pages/ProSales.tsx`** — adicionar toast antes do redirect para `/auth`.

