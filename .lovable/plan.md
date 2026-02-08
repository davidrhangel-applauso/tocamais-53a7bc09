

## Plano: Nova Landing Page Focada em Artistas

### Objetivo
Redesenhar a pagina `/landing` para criar uma experiencia de alta conversao focada em:
1. **Atrair novos artistas** para se cadastrar na plataforma
2. **Vender assinaturas PRO** mostrando os beneficios de 0% de taxa

### Inspiracao dos Concorrentes

**TocaI (tocai.com.br)**
- Headline forte: "O show agora e seu!"
- Foco em revolucionar pedidos musicais
- Secoes separadas para clientes e artistas
- Apps disponiveis (iOS/Android)

**Toca ae (tocaae.com.br)**
- Proposta clara: "Peca suas musicas favoritas direto para os cantores"
- Secao dedicada para produtores e cantores
- Design limpo e direto

### Nova Estrutura da Landing Page

**Secao 1: Hero Impactante**
- Headline: "Transforme Seu Talento em Renda"
- Subheadline: "Receba gorjetas, pedidos de musica e conecte-se com seu publico"
- Badge animado: "Junte-se a artistas que ja usam Toca+"
- CTA Principal: "Cadastrar como Artista" (abre PremiumOfferModal)
- CTA Secundario: "Sou Cliente" (navega para /buscar)
- Imagem de fundo do concerto

**Secao 2: Como Funciona (para Artistas)**
- Titulo: "Simples como tocar sua musica"
- 4 passos com icones animados:
  1. Crie seu perfil (gratis)
  2. Adicione seu repertorio
  3. Faca check-in no show
  4. Receba gorjetas e pedidos
- CTA: "Comecar Agora"

**Secao 3: Beneficios para Artistas**
- Grid de cards com beneficios:
  - Gorjetas via PIX instantaneo
  - Pedidos de musica em tempo real
  - QR Code personalizado
  - Perfil profissional completo
  - Analytics de performance
  - Visibilidade na busca

**Secao 4: Comparativo Free vs PRO**
- Titulo: "Escolha o melhor plano para voce"
- Tabela lado a lado:

| Recurso | FREE | PRO |
|---------|------|-----|
| Taxa de gorjetas | 20% | 0% |
| Pedidos de musica | Sim | Sim |
| Perfil completo | Sim | Sim |
| PIX direto | Nao | Sim |
| Destaque na busca | Nao | Sim |
| Analytics avancado | Basico | Completo |

- Destaque visual no PRO com badge "Recomendado"
- CTA: "Assinar PRO" e "Comecar Gratis"

**Secao 5: Calculadora de Economia**
- Reutilizar/adaptar o componente SavingsCalculator
- Titulo: "Quanto voce pode economizar?"
- Input interativo para gorjetas mensais
- Resultado dinamico mostrando economia anual

**Secao 6: Depoimentos de Artistas**
- Titulo: "O que os artistas estao dizendo"
- Cards com fotos, nomes, estilos musicais
- Citacoes sobre aumento de ganhos e facilidade

**Secao 7: Planos e Precos**
- Cards de precos (Mensal, Anual, Bienal)
- Destacar o plano Anual como "Mais Popular"
- Mostrar economia em cada plano
- CTA em cada card

**Secao 8: Para Clientes**
- Secao menor focada em quem quer pedir musicas
- Titulo: "Quer pedir musicas?"
- Beneficios: Encontre artistas perto de voce, Envie pedidos, De gorjetas
- CTA: "Buscar Artistas"

**Secao 9: Para Estabelecimentos**
- Secao para bares/restaurantes
- Titulo: "Tem um bar ou restaurante?"
- Beneficios: Atraia mais clientes, Organize eventos, Conecte-se com artistas
- CTA: "Cadastrar Estabelecimento"

**Secao 10: FAQ**
- Perguntas frequentes sobre cadastro e uso
- Foco em duvidas de artistas

**Secao 11: CTA Final**
- Headline: "Pronto para comecar?"
- CTA grande: "Cadastrar como Artista"
- Link secundario: "Ja tem conta? Entrar"

**Secao 12: Footer**
- Logo Toca+
- Links uteis (Instrucoes, Termos)
- Copyright

### Elementos de Alta Conversao

| Elemento | Implementacao |
|----------|---------------|
| Urgencia | Badge "Oferta por tempo limitado" no PRO |
| Prova social | Contador de artistas cadastrados |
| Calculadora | Economia dinamica baseada em input |
| Comparativo | Tabela visual Free vs PRO |
| Garantia | "Cancele quando quiser" |
| CTAs multiplos | Botoes estrategicos em cada secao |
| Animacoes | Elementos flutuantes e fade-in |

### Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/Landing.tsx` | Substituir | Nova estrutura completa com todas as secoes |

### Componentes a Reutilizar

- `PremiumOfferModal` - Para mostrar planos ao clicar em "Sou Artista"
- Logica de autenticacao existente
- Paleta de cores Se7 Produtora (laranja/vermelho/amarelo)
- Imagem hero-concert.jpg

### Design e Cores

Manter paleta Se7 Produtora:
- Primary (laranja) para CTAs principais
- Primary-glow (coral) para acentos
- Accent (amarelo dourado) para destaques de preco
- Verde para badges de economia e "Ao Vivo"
- Fundo escuro com gradientes

### Responsividade

- Mobile-first com stack vertical em telas pequenas
- Tabela comparativa com scroll horizontal em mobile
- CTAs com min-height de 48px para touch
- Espacamento generoso entre secoes

### Fluxo de Conversao

```text
Visitante chega em /landing
       |
       v
Le sobre beneficios para artistas
       |
       v
Usa calculadora de economia
       |
       v
Clica em "Cadastrar como Artista"
       |
       v
Abre PremiumOfferModal
       |
       +-> Seleciona plano PRO -> /auth?upgrade=true
       |
       +-> Continua Gratis -> /auth
```

