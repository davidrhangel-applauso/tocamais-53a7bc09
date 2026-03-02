

## Problema

Quando um usuário não cadastrado clica para assinar o PRO na página `/pro`, ele é redirecionado para `/auth?upgrade=true`. Porém, a página Auth **ignora o parâmetro `upgrade=true`** — após login ou cadastro, sempre redireciona para `/painel` sem iniciar o checkout.

## Plano

### Passo único: Atualizar `src/pages/Auth.tsx` para tratar `?upgrade=true`

1. Ler o query param `upgrade` da URL via `useSearchParams`
2. Após login ou cadastro bem-sucedido, se `upgrade=true`:
   - Redirecionar para `/pro` (onde o usuário, agora autenticado, pode clicar para assinar)
3. Caso contrário, manter o redirect padrão para `/painel`

Alterações mínimas: apenas nos handlers `handleSignIn` e `handleSignUp`, trocar o destino do `navigate()` quando `upgrade=true`.

