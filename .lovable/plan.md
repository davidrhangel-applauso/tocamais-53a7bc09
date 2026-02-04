
## Plano: Landing Page de Alta Conversao para Toca+

### Objetivo
Criar uma nova landing page otimizada para conversao, com elementos de marketing digital comprovados para atrair e converter novos usuarios (artistas, clientes e estabelecimentos).

### Situacao Atual
A landing page existente (`/`) em `Landing.tsx` possui:
- Hero section com imagem de fundo
- Secao de artistas proximos
- Cards de "Como Funciona"
- CTA final
- Footer basico

Faltam elementos essenciais para alta conversao como: prova social, depoimentos, estatisticas, beneficios detalhados por persona, urgencia, FAQ, comparativo de planos e videos/demonstracoes.

### Estrutura da Nova Landing Page

**Secao 1: Hero Section (Impacto Visual)**
- Headline focada no beneficio principal
- Subheadline explicando a proposta de valor
- Video embed ou animacao demonstrativa (opcional)
- CTAs duplos: "Sou Artista" (primario) e "Buscar Artista" (secundario)
- Badge de "Gratis para comecar"
- Indicador de scroll animado

**Secao 2: Prova Social (Confianca)**
- Numeros em destaque animados (contador):
  - "X+ artistas cadastrados"
  - "X+ gorjetas enviadas"
  - "X+ musicas pedidas"
- Logos de parceiros/mencionados (se houver)
- Badge "100% Seguro via PIX"

**Secao 3: Como Funciona (3 Passos Visuais)**
- Para Clientes: Encontre -> Peca -> Apoie
- Para Artistas: Cadastre -> Toque -> Receba
- Icones animados e ilustracoes

**Secao 4: Beneficios por Persona (Tabs ou Cards)**

Para Artistas:
- Receba gorjetas via PIX instantaneo
- Gerencie pedidos de musica em tempo real
- QR Code personalizado para shows
- Analytics de performance
- Destaque na busca por localizacao

Para Clientes:
- Peca sua musica favorita ao vivo
- Apoie artistas independentes diretamente
- Sem cadastro necessario
- Pagamento rapido e seguro

Para Estabelecimentos:
- Atraia mais clientes com musica ao vivo
- Check-in de artistas no local
- Dashboard de gestao
- QR Code do estabelecimento

**Secao 5: Depoimentos/Social Proof**
- Cards com foto, nome, tipo (artista/cliente)
- Citacoes de usuarios satisfeitos
- Rating com estrelas
- Carrossel automatico

**Secao 6: Comparativo de Planos (Artistas)**
- Tabela comparativa: Free vs PRO
- Destaque para economia de taxas
- CTA para assinar PRO

**Secao 7: FAQ (Accordion)**
- Perguntas frequentes sobre:
  - Seguranca do pagamento
  - Taxas
  - Como comecar
  - Suporte

**Secao 8: CTA Final (Urgencia)**
- Headline de urgencia
- Formulario simplificado ou botao direto
- Garantia de satisfacao

**Secao 9: Footer Completo**
- Links uteis
- Redes sociais
- Contato
- Termos e politicas

### Elementos de Conversao a Implementar

| Elemento | Descricao |
|----------|-----------|
| Contador animado | Numeros que "sobem" ao entrar na tela |
| Sticky CTA mobile | Botao flutuante que acompanha o scroll |
| Exit intent (futuro) | Modal ao tentar sair da pagina |
| Loading skeleton | Feedback visual durante carregamento |
| Microinteracoes | Hover effects, animacoes sutis |
| Urgency badge | "Oferta limitada" ou "X artistas online agora" |
| Trust badges | Selos de seguranca, PIX, etc |

### Arquitetura de Componentes

```text
src/pages/Landing.tsx (atualizado)
  |
  +-- components/landing/
       |-- HeroSection.tsx
       |-- SocialProofStats.tsx
       |-- HowItWorksSection.tsx
       |-- BenefitsSection.tsx
       |-- TestimonialsCarousel.tsx
       |-- PricingComparison.tsx
       |-- FAQSection.tsx
       |-- FinalCTA.tsx
       |-- LandingFooter.tsx
       +-- StickyMobileCTA.tsx
```

### Animacoes e Interatividade
- Usar animacoes existentes do Tailwind config: `fade-in`, `fade-in-up`, `scale-in`, `float`
- Adicionar novas keyframes para contador numerico
- Intersection Observer para animacoes on-scroll
- Carrossel de depoimentos com Embla (ja instalado)

### Cores e Design
Manter paleta Se7 Produtora:
- Primary: Laranja vibrante (HSL 25 95% 53%)
- Primary-glow: Vermelho coral (HSL 10 85% 58%)
- Accent: Amarelo dourado (HSL 42 92% 56%)
- Background escuro no dark mode

### Responsividade
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Imagens otimizadas para cada tamanho
- Touch-friendly CTAs (min 44px)

### Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/Landing.tsx` | Editar | Refatorar para usar novos componentes |
| `src/components/landing/HeroSection.tsx` | Criar | Hero otimizado com CTAs |
| `src/components/landing/SocialProofStats.tsx` | Criar | Contadores animados |
| `src/components/landing/HowItWorksSection.tsx` | Criar | Passos visuais |
| `src/components/landing/BenefitsSection.tsx` | Criar | Beneficios por persona com tabs |
| `src/components/landing/TestimonialsCarousel.tsx` | Criar | Carrossel de depoimentos |
| `src/components/landing/PricingComparison.tsx` | Criar | Tabela Free vs PRO |
| `src/components/landing/FAQSection.tsx` | Criar | Accordion de perguntas |
| `src/components/landing/FinalCTA.tsx` | Criar | CTA de urgencia |
| `src/components/landing/LandingFooter.tsx` | Criar | Footer completo |
| `src/components/landing/StickyMobileCTA.tsx` | Criar | CTA fixo no mobile |
| `src/hooks/useCountAnimation.ts` | Criar | Hook para animar numeros |
| `tailwind.config.ts` | Editar | Adicionar keyframes de contador |

### Depoimentos (Dados Mockados Inicialmente)
Sera criado um array de depoimentos de exemplo que pode ser substituido por dados reais do banco posteriormente:

```text
[
  { nome: "Joao Silva", tipo: "Artista", cidade: "SP", texto: "Triplicei minhas gorjetas...", rating: 5 },
  { nome: "Maria Santos", tipo: "Cliente", cidade: "RJ", texto: "Adoro poder pedir musicas...", rating: 5 },
  { nome: "Bar do Ze", tipo: "Estabelecimento", cidade: "BH", texto: "Nossos clientes adoram...", rating: 5 }
]
```

### Metricas de Conversao Futuras
Estrutura preparada para tracking:
- Click em CTAs
- Scroll depth
- Tempo na pagina
- Conversao por origem

### Beneficios Esperados
- Maior taxa de conversao de visitantes
- Melhor explicacao do produto
- Confianca atraves de prova social
- Reducao de bounce rate
- Melhor SEO com conteudo estruturado

### Consideracoes Tecnicas
- Manter NearbyArtists existente (funcionalidade importante)
- Manter PremiumOfferModal existente
- Lazy loading para componentes abaixo do fold
- Skeleton loading para estatisticas do banco
- Preservar logica de redirecionamento de usuarios autenticados
