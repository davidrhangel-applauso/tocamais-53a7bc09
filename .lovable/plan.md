

## Substituir logo por player de vídeo do YouTube na Hero

### Alteração em `src/components/landing/LandingHero.tsx`

**Linhas 52-55** — Substituir o bloco da logo por um player de YouTube responsivo com embed via iframe.

O ID do vídeo é `tLeo0JgrEr0`.

```tsx
// Substituir:
<div className="flex justify-center mb-6 sm:mb-8 animate-scale-in">
  <img src={logoTocaMais} alt="Toca Mais" className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 animate-float drop-shadow-2xl" />
</div>

// Por:
<div className="w-full max-w-3xl mx-auto mb-6 sm:mb-8 animate-scale-in rounded-2xl overflow-hidden shadow-2xl border border-white/10">
  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
    <iframe
      className="absolute inset-0 w-full h-full"
      src="https://www.youtube.com/embed/tLeo0JgrEr0?rel=0&modestbranding=1"
      title="Toca Mais - Vídeo"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
</div>
```

- Aspect ratio 16:9 via `paddingBottom: 56.25%`
- Responsivo em todas as telas (mobile, tablet, desktop)
- Bordas arredondadas + sombra para manter o visual premium
- Remover import não utilizado de `logoTocaMais`

