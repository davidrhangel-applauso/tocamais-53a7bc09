

## Alterar terminologia de "recuperação" para "redefinir senha"

### Problema
O fluxo atual usa o termo "recuperação" (recuperar senha / link de recuperação), mas o usuário quer que seja "redefinir senha" em todo o fluxo.

### Alterações em `src/pages/Auth.tsx`

1. **Linha 242** — Botão: `"Enviar Link de Recuperação"` → `"Enviar Link para Redefinir Senha"`
2. **Linha 127** — Toast: `"Email de recuperação enviado!"` → `"Email para redefinição de senha enviado!"`
3. **Linha 130** — Toast erro: `"Erro ao enviar email de recuperação"` → `"Erro ao enviar email de redefinição"`
4. **Linha 289-293** — Link: `"Esqueci minha senha"` → `"Redefinir minha senha"`

### Alterações em `src/pages/ResetPassword.tsx`

5. **Linha 36** — Toast erro: `"Link de recuperação inválido ou expirado"` → `"Link de redefinição inválido ou expirado"`

Nenhuma alteração de lógica — apenas textos.

