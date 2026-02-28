export const STRIPE_PLANS = {
  mensal: {
    name: "Mensal",
    price_id: "price_1T5uYrK9iScCpCyIPO1vAvXp",
    product_id: "prod_U42eL1QKCGCAhA",
    price: 19.90,
    period: "/mês",
    description: "Sem compromisso",
    savings: null,
    recommended: false,
  },
  anual: {
    name: "Anual",
    price_id: "price_1T5uZNK9iScCpCyI3V89oboN",
    product_id: "prod_U42etWsokczgbV",
    price: 99.00,
    period: "/ano",
    description: "R$ 8,25/mês",
    savings: "Economize R$ 139,80",
    recommended: true,
  },
  bienal: {
    name: "Bienal",
    price_id: "price_1T5ua3K9iScCpCyIjE7vp6yU",
    product_id: "prod_U42fQZq7HWzqlV",
    price: 169.90,
    period: "/2 anos",
    description: "R$ 7,08/mês",
    savings: "Economize R$ 308,50",
    recommended: false,
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;
