

## Análise Completa: O que falta para o TocaMais ficar perfeito

Revisei toda a estrutura do projeto — rotas, páginas, componentes, banco de dados, segurança e UX. Aqui está o diagnóstico organizado por categoria:

---

### 1. URLs amigáveis incompletas

Os links de navegação em **Home.tsx**, **SearchArtists.tsx**, **NearbyArtists.tsx** e **Admin.tsx** ainda usam `/artista/${artist.id}` (UUID) em vez da URL amigável com slug. O slug foi implementado mas não está sendo usado nos links internos.

**Correção:** Buscar o campo `slug` junto com os perfis e usar `navigate(\`/${artist.slug}\`)` quando disponível, com fallback para `/artista/${artist.id}`.

---

### 2. IDs de admin hardcoded em 3 arquivos

O array `ADMIN_USER_IDS` está duplicado em `Home.tsx`, `SearchArtists.tsx` e `NearbyArtists.tsx`. Isso é frágil e difícil de manter.

**Correção:** Centralizar numa constante em `src/lib/constants.ts` ou usar a tabela `user_roles` para filtrar admins via query (`NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')`).

---

### 3. Falta de proteção de rotas centralizada

Cada página faz sua própria verificação de autenticação com `supabase.auth.getUser()` + redirect manual. Não há um componente `ProtectedRoute` ou `AuthGuard`.

**Correção:** Criar um componente `ProtectedRoute` que envolva rotas autenticadas, reduzindo código duplicado e garantindo consistência.

---

### 4. Página de Configurações não acessível para estabelecimentos

`Settings.tsx` só funciona para artistas (`tipo === "artista"`). Estabelecimentos têm a aba Perfil no painel, mas não têm acesso à rota `/configuracoes`. Se um estabelecimento acessar, pode ter comportamento inesperado.

**Correção:** Adicionar guard na rota ou redirecionar estabelecimentos para `/painel-local?tab=perfil`.

---

### 5. Sem confirmação de email

O fluxo de cadastro não exige confirmação de email (baseado na análise do `Auth.tsx`). Qualquer pessoa pode criar conta com email falso.

**Correção:** Verificar se auto-confirm está desabilitado na configuração de auth e garantir que o fluxo de verificação de email funcione.

---

### 6. Sem paginação nas listagens

`Home.tsx` e `SearchArtists.tsx` carregam artistas com `.limit(20)` ou sem limite. Conforme o app cresce, isso vai causar problemas de performance.

**Correção:** Implementar scroll infinito ou paginação com botão "Carregar mais".

---

### 7. Sem tratamento de erro global

Não há `ErrorBoundary` no React. Se um componente quebrar, a tela inteira fica branca.

**Correção:** Adicionar `ErrorBoundary` no `App.tsx` com fallback amigável.

---

### 8. SEO e Meta Tags

A landing page não tem meta tags dinâmicas (Open Graph, Twitter Cards). Compartilhamentos no WhatsApp/Instagram mostram preview genérico.

**Correção:** Adicionar `react-helmet-async` com meta tags na Landing e nos perfis de artistas.

---

### 9. Falta loading skeleton consistente

Algumas páginas mostram "Carregando..." como texto simples, outras usam `Skeleton`. A experiência não é uniforme.

**Correção:** Padronizar usando os componentes `Skeleton` já existentes em todas as páginas.

---

### 10. Funcionalidades que faltam para completude

| Feature | Status | Impacto |
|---|---|---|
| **Recuperação de senha** | ✅ Existe (`ResetPassword.tsx`) | OK |
| **Deletar conta** | ❌ Não existe | Alto — exigência LGPD |
| **Exportar dados** | ❌ Não existe | Médio — LGPD |
| **Notificações push (PWA)** | ❌ Parcialmente (só in-app) | Médio |
| **Avaliação de estabelecimentos** | ❌ Só de artistas | Baixo |
| **Relatórios para estabelecimentos** | ❌ Sem analytics próprio | Médio |
| **Busca de estabelecimentos** | ❌ Clientes não encontram locais | Médio |

---

### Resumo de prioridades

**Alta prioridade (bugs/segurança):**
1. Usar slug nas navegações internas (4 arquivos)
2. Centralizar IDs de admin / usar `user_roles`
3. Implementar deletar conta (LGPD)

**Média prioridade (UX/qualidade):**
4. Criar `ProtectedRoute` centralizado
5. ErrorBoundary global
6. Paginação nas listagens
7. Skeletons consistentes

**Baixa prioridade (melhorias):**
8. Meta tags / SEO
9. Notificações push reais
10. Analytics para estabelecimentos

Quer que eu implemente algum desses itens? Posso começar pelos de alta prioridade.

