

## Plano: Substituir logo e favicon pelo novo Logo.png

### Resumo

Copiar o novo `Logo.png` para dois locais: `src/assets/` (para uso em componentes React) e `public/` (para favicon e PWA). Atualizar todas as referências.

### Mudanças

| Local | Ação |
|---|---|
| `src/assets/logo-tocamais.png` | Substituir pelo novo `Logo.png` (copiar `user-uploads://Logo.png` → `src/assets/logo-tocamais.png`) |
| `public/favicon.png` | Substituir pelo novo `Logo.png` (copiar `user-uploads://Logo.png` → `public/favicon.png`) |
| `src/components/landing/StickyHeaderCTA.tsx` | Adicionar import do logo e exibir imagem ao lado do texto "Toca Mais" |

### Detalhes

- Manter o mesmo nome `logo-tocamais.png` no assets evita editar os 3 arquivos que já importam (`Auth.tsx`, `Home.tsx`, `LandingFooter.tsx`).
- O favicon e ícones PWA já referenciam `/favicon.png`, então basta substituir o arquivo.
- O `StickyHeaderCTA` é o único local com "Toca Mais" no header que ainda não mostra o logo.
- `og:image` e `twitter:image` no `index.html` já apontam para `/favicon.png` -- serão atualizados automaticamente.

