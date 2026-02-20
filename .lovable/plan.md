
## Três melhorias na Landing Page

### 1. Favicon (já configurado)
O `favicon.png` atual já está corretamente referenciado no `index.html` (`<link rel="icon" href="/favicon.png" />`). Vamos garantir que ele também apareça como ícone do app PWA (ver item 2 abaixo).

---

### 2. Botão "Instalar App" (PWA)

O projeto ainda não tem suporte a PWA. Vamos configurá-lo do zero para que usuários consigam instalar o app na tela inicial do celular (iOS e Android) — sem precisar de loja de apps.

**Passos técnicos:**

**a) Instalar `vite-plugin-pwa`**
Único pacote necessário. Integra automaticamente com Vite.

**b) Configurar `vite.config.ts`**
Adicionar o plugin com o manifesto do app:
```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    navigateFallbackDenylist: [/^\/~oauth/], // nunca cachear rotas OAuth
  },
  manifest: {
    name: 'Toca Mais',
    short_name: 'Toca+',
    description: 'Gorjetas e pedidos de música via PIX',
    theme_color: '#...',  // cor primary do app
    background_color: '#000000',
    display: 'standalone',
    icons: [
      { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon.png', sizes: '512x512', type: 'image/png' },
    ],
  },
})
```

**c) Adicionar meta tags PWA ao `index.html`**
```html
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Toca+" />
<link rel="apple-touch-icon" href="/favicon.png" />
```

**d) Criar hook `useInstallPrompt.ts`**
Captura o evento `beforeinstallprompt` do navegador e expõe:
- `canInstall: boolean` — se o dispositivo suporta instalação
- `install(): Promise<void>` — dispara o prompt nativo de instalação

**e) Adicionar botão na Landing Page**
- No `StickyHeaderCTA`: Adicionar botão "📲 Instalar App" ao lado dos botões existentes (visível quando `canInstall = true`)
- No `LandingHero`: Adicionar um terceiro badge de confiança "✓ Instale no celular" e um botão secundário "Instalar Grátis" abaixo dos CTAs principais
- O botão só aparece em dispositivos que suportam a instalação (Android Chrome, Edge, etc.) — em iOS mostramos uma dica de "Adicionar à tela inicial"

---

### 3. Atualizar informações do plano Free

Vários componentes ainda têm informações desatualizadas sobre o plano Free (taxa de 20%, PIX apenas no PRO). Com a nova arquitetura, **ambos os planos recebem via PIX direto**, mas o Free tem limite de R$ 10,00.

**Arquivos a corrigir:**

**`PlanComparison.tsx`** — Tabela de features:
```
ANTES:
- "Taxa da plataforma": Free=20%, PRO=0%
- "PIX direto na sua conta": Free=❌, PRO=✅

DEPOIS:
- "Gorjetas via PIX": Free=✅, PRO=✅
- "Limite de gorjetas": Free="R$ 10/mês", PRO="Ilimitado"
- "Taxa da plataforma": Free=0%, PRO=0%  (removida ou ambos 0%)
- "Destaque na busca": Free=❌, PRO=✅
- "Analytics completo": Free=❌, PRO=✅
- "Suporte prioritário": Free=❌, PRO=✅
```
O header do plano Free mostrará "Grátis • Até R$ 10" em vez de apenas "R$ 0".

**`LandingFAQ.tsx`** — Duas respostas a corrigir:
1. Pergunta "O cadastro é gratuito?" → Remover menção da taxa de 20%: *"No plano Free você recebe gorjetas via PIX até R$ 10 para experimentar o app."*
2. Pergunta "Qual a diferença entre Free e PRO?" → Atualizar com a realidade atual: *"No Free você recebe via PIX até R$ 10 de gorjetas para testar. No PRO, gorjetas ilimitadas, destaque na busca, analytics e suporte prioritário."*

**`PremiumOfferModal.tsx`** — Lista de benefícios PRO:
```
ANTES: "Taxa de apenas 5% (vs 10% no plano Free)"
DEPOIS: "Gorjetas ilimitadas via PIX (Free: até R$ 10)"
```
Também atualizar: *"Sem limite de pedidos"* → manter, e remover qualquer referência a taxa de Free.

**`LandingHero.tsx`** — Subtítulo abaixo do headline:
```
ANTES: "Com o plano PRO, você recebe 100% das gorjetas direto na sua conta"
DEPOIS: "Teste grátis até R$ 10 em gorjetas. Com o plano PRO, receba ilimitado."
```
Ou algo que comunique claramente o modelo freemium.

**`PricingCards.tsx`** — Já está com informações mais atualizadas, mas verificar se os features do plano Monthly/Anual/Bienal ainda mencionam "0% de taxa nas gorjetas" — ok, está correto.

---

### Resumo dos arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `package.json` | Adicionar `vite-plugin-pwa` |
| `vite.config.ts` | Configurar VitePWA com manifesto |
| `index.html` | Adicionar meta tags PWA |
| `src/hooks/useInstallPrompt.ts` | Novo hook para capturar evento de instalação |
| `src/components/landing/StickyHeaderCTA.tsx` | Botão "Instalar App" |
| `src/components/landing/LandingHero.tsx` | Badge + botão instalar + texto atualizado |
| `src/components/landing/PlanComparison.tsx` | Atualizar tabela de features |
| `src/components/landing/LandingFAQ.tsx` | Corrigir 2 respostas |
| `src/components/PremiumOfferModal.tsx` | Corrigir lista de benefícios |
