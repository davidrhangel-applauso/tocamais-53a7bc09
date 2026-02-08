

## Plano: Corrigir a Pagina Index.tsx

### Problema Identificado
O arquivo `src/pages/Index.tsx` esta mostrando o conteudo padrao de fallback ("Welcome to Your Blank App") em vez da pagina de acesso que foi planejada anteriormente.

### Causa
As edicoes anteriores no arquivo Index.tsx nao foram persistidas corretamente, e o arquivo voltou ao estado original.

### Solucao
Atualizar o arquivo `src/pages/Index.tsx` para implementar a pagina de acesso que:
1. Verifica se o usuario esta autenticado e redireciona para o painel apropriado
2. Mostra opcoes de acesso para usuarios nao autenticados:
   - Botao "Sou Artista" (abre modal de oferta premium)
   - Botao "Buscar Artistas" (redireciona para /buscar)
   - Link "Sou Estabelecimento" (redireciona para /auth-estabelecimento)
   - Link "Conhecer o Toca+" (redireciona para /landing)

### Arquivo a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/Index.tsx` | Substituir | Implementar pagina de acesso completa com redirecionamento e CTAs |

### Estrutura da Nova Pagina

```text
Index.tsx
|
+-- Verificacao de autenticacao (useEffect)
|   |-- Usuario artista -> redireciona para /painel
|   |-- Usuario estabelecimento -> redireciona para /painel-local
|   +-- Usuario comum -> redireciona para /home
|
+-- Hero Section (usuarios nao autenticados)
|   |-- Logo Toca+ com icone de musica
|   |-- Titulo "Toca+"
|   |-- Subtitulo com proposta de valor
|   |-- Botao "Sou Artista" (abre PremiumOfferModal)
|   |-- Botao "Buscar Artistas" (navega para /buscar)
|   |-- Link "Sou Estabelecimento"
|   +-- Link "Conhecer o Toca+" (navega para /landing)
|
+-- PremiumOfferModal (modal de oferta premium)
    |-- Continuar Gratis -> /auth
    +-- Selecionar Plano -> /auth?upgrade=true
```

### Imports Necessarios

```text
- Button do @/components/ui/button
- Music, Heart, Building2 do lucide-react
- useNavigate do react-router-dom
- useEffect, useState do react
- supabase do @/integrations/supabase/client
- waitForProfile do @/lib/auth-utils
- PremiumOfferModal do @/components/PremiumOfferModal
- heroImage do @/assets/hero-concert.jpg
```

### Design Visual

- Imagem de fundo (hero-concert.jpg) com overlay escuro
- Logo centralizado com icone de musica animado
- Titulo com gradiente de cores (primary -> accent)
- Botoes com estilo gradiente para CTAs principais
- Layout responsivo mobile-first

