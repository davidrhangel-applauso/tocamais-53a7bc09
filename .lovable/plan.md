

## Plano: Substituir ícone Music pela logo na página Index

### Problema

Na página inicial (`/`), o logo ainda é um ícone genérico `<Music />` do Lucide em vez da nova logo `logo-tocamais.png`.

### Mudança

**`src/pages/Index.tsx`** (linhas 86-92):
- Importar `logoTocaMais` de `@/assets/logo-tocamais.png`
- Substituir o círculo com ícone Music por uma `<img>` com a logo, mantendo o efeito de glow ao redor

```tsx
// Antes
<div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-accent shadow-2xl">
  <Music className="h-10 w-10 text-primary-foreground" />
</div>

// Depois
<img src={logoTocaMais} alt="Toca Mais" className="relative h-20 w-20 rounded-full shadow-2xl" />
```

