

## Resultado da Análise

Revisei o código completo do fluxo de URLs amigáveis e encontrei **um problema importante** que precisa ser corrigido antes de o fluxo funcionar como esperado:

### Problema: `ArtistBySlug.tsx` redireciona para `/artista/:id`

O componente `ArtistBySlug` resolve o slug corretamente, mas depois **redireciona o usuário para `/artista/{uuid}`**, trocando a URL amigável pela URL com ID. Isso anula o propósito da feature — o usuário acessa `tocamais.app/banda-rock` mas acaba vendo `tocamais.app/artista/abc-123-uuid` no navegador.

### Correção necessária

Alterar `ArtistBySlug.tsx` para **renderizar diretamente** o `ArtistProfile` passando o `artistId` como prop, em vez de redirecionar. Isso exige uma pequena alteração no `ArtistProfile` para aceitar um `id` via prop além do `useParams`.

### Mudanças

| Arquivo | Ação |
|---|---|
| `src/pages/ArtistProfile.tsx` | Aceitar prop opcional `artistId` e usar `artistId \|\| id` do `useParams` |
| `src/pages/ArtistBySlug.tsx` | Renderizar `<ArtistProfile artistId={artistId} />` diretamente em vez de redirecionar |

### Detalhes técnicos

**`ArtistProfile.tsx`** (linha ~2, ~34):
```tsx
// Adicionar prop interface
interface ArtistProfileProps {
  artistId?: string;
}

const ArtistProfile = ({ artistId: propId }: ArtistProfileProps) => {
  const { id: paramId } = useParams();
  const id = propId || paramId;
  // ... resto do componente usa `id` normalmente
```

**`ArtistBySlug.tsx`** — simplificar para:
```tsx
if (artistId) {
  return <ArtistProfile artistId={artistId} />;
}
```

Remover o `ArtistProfileWrapper` inteiramente.

### Sobre a tela de Configurações

O código para exibir e editar o slug está implementado corretamente em `Settings.tsx`:
- Campo "URL Personalizada" com prefixo `tocamais.app/`
- Sanitização de input (lowercase, sem caracteres especiais)
- Valor salvo junto com o restante do perfil

Não é possível testar via browser sem estar logado como artista, mas o código está correto.

