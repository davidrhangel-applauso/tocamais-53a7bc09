

## Plano: Lightbox de aviso antes de redirecionar para login

### O que será feito

Quando um usuário **não autenticado** clicar em "Assinar PRO" (na página `/pro` ou na landing), em vez de redirecionar imediatamente para `/auth?upgrade=true`, será exibido um **Dialog (lightbox)** informando que é necessário criar conta ou fazer login. Ao fechar o dialog, o usuário é redirecionado para a página de autenticação.

### Implementação

**1. Criar componente `AuthRequiredDialog`** (`src/components/AuthRequiredDialog.tsx`)
- Dialog com título "Cadastro necessário"
- Texto explicativo: "Para assinar o plano PRO, você precisa criar uma conta ou fazer login primeiro."
- Botão "Ir para Login/Cadastro" que fecha o dialog e navega para `/auth?upgrade=true`
- Ao fechar (X ou overlay), também navega para `/auth?upgrade=true`

**2. Atualizar `src/pages/ProSales.tsx`**
- Adicionar estado `showAuthDialog` 
- No `handleCTAClick`, se não autenticado: abrir o dialog em vez de redirecionar
- Ao fechar o dialog → `navigate("/auth?upgrade=true")`

**3. Atualizar `src/pages/Landing.tsx`**
- Mesmo padrão: quando `handleArtistClick` é chamado por usuário não autenticado, mostrar o dialog antes de redirecionar

