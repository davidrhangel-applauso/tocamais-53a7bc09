import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminPrices, formatPrice } from "@/hooks/useAdminPrices";

interface PricingCardsProps {
  onSelectPlan: (plan: "monthly" | "annual" | "biennial") => void;
}

export function PricingCards({ onSelectPlan }: PricingCardsProps) {
  const prices = useAdminPrices();

  const plans = [
    {
      id: "monthly" as const,
      name: "Mensal",
      price: prices.mensal,
      period: "/mês",
      monthlyEquivalent: null as number | null,
      description: "Perfeito para testar",
      features: [
        "0% de taxa nas gorjetas",
        "PIX direto na sua conta",
        "Destaque na busca",
        "Analytics completo",
      ],
      popular: false,
      savings: null as string | null,
      bestValue: false,
    },
    {
      id: "annual" as const,
      name: "Anual",
      price: prices.anual,
      period: "/ano",
      monthlyEquivalent: prices.anualMonthly,
      description: "Mais economia",
      features: [
        "0% de taxa nas gorjetas",
        "PIX direto na sua conta",
        "Destaque na busca",
        "Analytics completo",
        "Suporte prioritário",
      ],
      popular: true,
      savings: prices.anualSavingsText,
      bestValue: false,
    },
    {
      id: "biennial" as const,
      name: "Bienal",
      price: prices.bienal,
      period: "/2 anos",
      monthlyEquivalent: prices.bienalMonthly,
      description: "Melhor custo-benefício",
      features: [
        "0% de taxa nas gorjetas",
        "PIX direto na sua conta",
        "Destaque na busca",
        "Analytics completo",
        "Suporte prioritário",
        "Badge exclusivo no perfil",
      ],
      popular: false,
      savings: prices.bienalSavingsText,
      bestValue: true,
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <Badge className="bg-accent/20 text-accent border-accent/30 mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Oferta especial
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Escolha seu plano{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PRO
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Receba 100% das suas gorjetas. Cancele quando quiser.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative bg-card border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl",
                plan.popular 
                  ? "border-primary shadow-lg shadow-primary/20 scale-105" 
                  : plan.bestValue
                  ? "border-green-500/50"
                  : "border-border hover:border-primary/50"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              )}
              {plan.bestValue && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white">
                  Melhor Valor
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                
                <div className="mb-2">
                  <span className="text-4xl font-bold">
                    R$ {formatPrice(plan.price)}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                
                {plan.monthlyEquivalent && (
                  <p className="text-sm text-muted-foreground">
                    = R$ {formatPrice(plan.monthlyEquivalent)}/mês
                  </p>
                )}
                
                {plan.savings && (
                  <Badge className="mt-2 bg-green-500/20 text-green-500 border-green-500/30">
                    {plan.savings}
                  </Badge>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "w-full py-6",
                  plan.popular
                    ? "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    : "bg-primary hover:bg-primary/90"
                )}
                onClick={() => onSelectPlan(plan.id)}
              >
                <Crown className="w-4 h-4 mr-2" />
                Assinar {plan.name}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          🔒 Pagamento seguro via PIX • Cancele quando quiser • Garantia de 7 dias
        </p>
      </div>
    </section>
  );
}
