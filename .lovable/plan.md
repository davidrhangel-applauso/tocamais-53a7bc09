

## Problema

Quando o usuário clica em "Assinar PRO Agora" nos CTAs genéricos (Hero, Calculadora, CTA Final, Mobile Sticky), o sistema pula a seleção de plano e usa "Anual" como padrão, abrindo direto o dialog de forma de pagamento.

## Solução

Adicionar uma etapa de seleção de plano no `PaymentMethodDialog`. O dialog passará a ter duas seções:

1. **Seleção do plano** (Mensal, Anual, Bienal) com preço e destaque no recomendado
2. **Seleção da forma de pagamento** (Cartão / PIX) — logo abaixo

### Mudanças

**`src/components/PaymentMethodDialog.tsx`**:
- Adicionar props: `selectedPlanKey`, `onPlanChange`, e importar `STRIPE_PLANS`
- Renderizar 3 botões/cards de plano (Mensal, Anual com badge "Mais Popular", Bienal) com preço, permitindo troca
- Manter os botões de Cartão e PIX logo abaixo da seleção de plano
- O plano selecionado fica destacado visualmente

**`src/pages/ProSales.tsx`**:
- Passar `selectedPlanKey` e `onPlanChange={setSelectedPlanKey}` ao `PaymentMethodDialog`

### Layout do dialog

```text
┌─────────────────────────────┐
│ Escolha seu plano e forma   │
│ de pagamento                │
├─────────────────────────────┤
│ [Mensal R$19,90/mês]        │
│ [★ Anual R$99,00/ano]       │  ← selecionável
│ [Bienal R$169,90/2anos]     │
├─────────────────────────────┤
│ [💳 Cartão de Crédito]      │
│ [📱 PIX (aprovação manual)] │
└─────────────────────────────┘
```

