

## Adicionar Login com Google

### Abordagem
O projeto usa Lovable Cloud, que já possui integração gerenciada com Google OAuth — não é necessária nenhuma configuração externa.

### Passos

**1. Configurar Social Login (ferramenta automática)**
- Usar a ferramenta "Configure Social Login" para gerar o módulo `src/integrations/lovable/` e instalar o pacote `@lovable.dev/cloud-auth-js`

**2. Atualizar `src/pages/Auth.tsx`**
- Importar `lovable` de `@/integrations/lovable/index`
- Adicionar botão "Entrar com Google" acima das tabs de login/cadastro
- Chamar `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` no click
- Estilizar com ícone do Google e visual consistente

**3. Atualizar `src/pages/AuthEstabelecimento.tsx`**
- Adicionar o mesmo botão de Google login para estabelecimentos

**4. Atualizar VitePWA config (`vite.config.ts`)**
- Adicionar `/~oauth` ao `navigateFallbackDenylist` do workbox para garantir que o redirect OAuth nunca seja interceptado pelo service worker

