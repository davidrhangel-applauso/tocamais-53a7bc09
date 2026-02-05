

## Plano: Pagina de Vendas PRO para Artistas

### Objetivo
Criar uma pagina de vendas dedicada e independente (`/pro`) focada exclusivamente em converter artistas para o plano PRO, com elementos de alta conversao e design persuasivo.

### Por Que Uma Pagina Separada?
- Foco total na conversao (sem distracao de outras funcionalidades)
- URL compartilhavel para campanhas de marketing (`/pro`)
- Mensagens direcionadas especificamente para artistas
- Estrutura otimizada para o funil de vendas

### Estrutura da Pagina de Vendas

**Secao 1: Hero de Impacto**
- Headline: "Receba 100% das Suas Gorjetas"
- Subheadline: "Zero taxa. Dinheiro direto na sua conta."
- Badge de urgencia: "Oferta Especial"
- CTA principal: "Assinar PRO Agora"
- Imagem/ilustracao de artista recebendo pagamento

**Secao 2: Problema e Dor**
- "Voce esta perdendo dinheiro a cada show"
- Calculo visual: "Se voce recebe R$ 500/mes em gorjetas, perde R$ 100/mes em taxas"
- Simulador interativo de economia

**Secao 3: A Solucao PRO**
- Cards de beneficios com icones animados:
  - 0% de taxa (vs 20% no Free)
  - PIX direto na sua conta
  - QR Code personalizado
  - Destaque na busca
  - Analytics completo

**Secao 4: Comparativo Visual Free vs PRO**
- Tabela lado a lado com check/X
- Destaque no ROI: "Se recebe R$ 100/mes em gorjetas, o PRO se paga em 1 show"

**Secao 5: Calculadora de Economia**
- Input: "Quanto voce recebe em gorjetas por mes?"
- Output dinamico: "Voce economizaria R$ X por mes com PRO"
- CTA: "Quero economizar"

**Secao 6: Depoimentos de Artistas PRO**
- Cards com foto, nome, estilo musical
- Citacoes sobre aumento de ganhos
- Badges "PRO" nos avatares

**Secao 7: Garantia e Seguranca**
- "Cancele quando quiser"
- "Pagamento seguro via PIX"
- "Suporte prioritario"
- Selos de confianca

**Secao 8: Planos e Precos**
- Mensal: R$ 19,90/mes
- Anual: R$ 99,00/ano (economize R$ 139,80)
- Bienal: R$ 169,90/2 anos (economize R$ 308,50)
- Destaque no plano recomendado

**Secao 9: FAQ Especifico**
- "Como funciona o pagamento?"
- "Quando o PRO e ativado?"
- "Posso cancelar?"
- "E se eu nao gostar?"

**Secao 10: CTA Final com Urgencia**
- "Comece a receber 100% hoje"
- Timer ou badge de oferta limitada
- Botao grande e chamativo

**Secao 11: Footer Minimalista**
- Link para termos
- Voltar ao inicio

### Elementos de Conversao

| Elemento | Implementacao |
|----------|---------------|
| Calculadora de economia | Componente interativo com input/output |
| Comparativo visual | Tabela com cores e icones |
| Social proof | Depoimentos com avatares |
| Urgencia | Badge "Oferta Especial" |
| Garantia | Secao dedicada com selos |
| CTA repetido | Botao em multiplas secoes |
| Sticky CTA mobile | Botao fixo no rodape mobile |

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/ProSales.tsx` | Pagina principal de vendas |
| `src/components/sales/SalesHero.tsx` | Hero section |
| `src/components/sales/ProblemSection.tsx` | Secao de problema/dor |
| `src/components/sales/SolutionSection.tsx` | Beneficios do PRO |
| `src/components/sales/SavingsCalculator.tsx` | Calculadora interativa |
| `src/components/sales/PricingSection.tsx` | Planos e precos |
| `src/components/sales/TestimonialsSection.tsx` | Depoimentos |
| `src/components/sales/GuaranteeSection.tsx` | Garantias e seguranca |
| `src/components/sales/SalesFAQ.tsx` | FAQ especifico |
| `src/components/sales/FinalCTA.tsx` | CTA final |
| `src/components/sales/StickyMobileCTA.tsx` | CTA fixo mobile |

### Arquivo a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Adicionar rota `/pro` |

### Fluxo de Conversao

```text
Usuario visita /pro
       |
       v
Le beneficios e calcula economia
       |
       v
Clica em "Assinar PRO"
       |
       v
Redireciona para /auth?upgrade=true
(ou abre modal de pagamento se ja logado)
       |
       v
Completa cadastro/login
       |
       v
Processa pagamento PIX
       |
       v
Ativa plano PRO
```

### Design e Cores

Manter paleta Se7 Produtora:
- Gradientes laranja/vermelho para CTAs
- Fundo escuro para contraste
- Destaques em amarelo dourado para precos
- Verde para badges de economia

### Responsividade

- Mobile-first com CTAs grandes (min 48px)
- Sticky CTA apenas em mobile
- Calculadora adaptada para touch
- Tabelas responsivas com scroll horizontal se necessario

### Beneficios Esperados

- Pagina dedicada para campanhas de marketing
- Maior taxa de conversao por foco unico
- URL compartilhavel para redes sociais
- Tracking facilitado de conversoes

