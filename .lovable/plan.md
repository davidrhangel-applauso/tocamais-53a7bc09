

## Plano: URLs amigáveis para perfis de artistas (`tocamais.app/nomedoartista`)

### Resumo

Sim, é possível! A ideia é adicionar um campo `slug` (apelido único para URL) na tabela `profiles` e criar uma rota `/:slug` que carrega o perfil do artista. Assim, cada artista terá uma URL como `tocamais.app/joaomusico`.

### Como funciona

1. **Novo campo `slug`** na tabela `profiles` — texto único, gerado automaticamente a partir do nome do artista (ex: "João Músico" → `joao-musico`), editável nas configurações.

2. **Nova rota `/:slug`** no `App.tsx` — posicionada **antes** da rota catch-all `*`, mas **depois** de todas as rotas fixas (`/auth`, `/painel`, `/home`, etc.) para não conflitar.

3. **Página de resolução de slug** — um componente que recebe o `slug`, busca o artista no banco e redireciona para `/artista/:id` (ou renderiza o perfil diretamente).

4. **Atualizar links de compartilhamento** — quando o artista compartilha seu perfil (QR Code, redes sociais), usar a URL amigável.

### Mudanças técnicas

| Local | Ação |
|---|---|
| **Migração SQL** | Adicionar coluna `slug` (text, unique, nullable) na tabela `profiles`. Criar função para gerar slug automaticamente no `handle_new_user`. |
| **`src/App.tsx`** | Adicionar rota `/:slug` antes do catch-all `*` |
| **Novo: `src/pages/ArtistBySlug.tsx`** | Componente que busca artista pelo slug e renderiza o perfil ou redireciona |
| **`src/pages/Settings.tsx`** | Campo para o artista personalizar seu slug/URL |
| **Links de navegação** | Atualizar `Home.tsx`, `SearchArtists.tsx`, `NearbyArtists.tsx` para usar `/slug` quando disponível |
| **`src/components/ProfileQRCode.tsx`** | Gerar QR code com URL amigável |

### Pontos de atenção

- **Conflito de rotas**: O slug não pode ser igual a rotas existentes (`auth`, `painel`, `home`, `admin`, etc.). Validação necessária no backend.
- **Unicidade**: Dois artistas não podem ter o mesmo slug. Se houver conflito, adicionar número (ex: `joao-musico-2`).
- **Caracteres**: Slug só aceita letras minúsculas, números e hífens.
- **Retrocompatibilidade**: A rota `/artista/:id` continua funcionando normalmente.

### Exemplo de fluxo

```text
Usuário acessa: tocamais.app/banda-rock
         ↓
Rota /:slug captura "banda-rock"
         ↓
Busca no banco: SELECT id FROM profiles WHERE slug = 'banda-rock' AND tipo = 'artista'
         ↓
Encontrou → Renderiza perfil do artista
Não encontrou → Mostra página 404
```

