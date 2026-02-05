import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

interface PricingSectionProps {
  onCTAClick: () => void;
}

const plans = [
  {
    name: "Mensal",
    price: 19.90,
    period: "/mês",
    description: "Sem compromisso",
    savings: null,
    recommended: false,
  },
  {
    name: "Anual",
    price: 99.00,
    period: "/ano",
    description: "R$ 8,25/mês",
    savings: "Economize R$ 139,80",
    recommended: true,
  },
  {
    name: "Bienal",
    price: 169.90,
    period: "/2 anos",
    description: "R$ 7,08/mês",
    savings: "Economize R$ 308,50",
    recommended: false,
  },
];

const features = [
  "0% de taxa em gorjetas",
  "PIX direto na sua conta",
  "QR Code personalizado",
  "Destaque na busca",
  "Analytics completo",
  "Suporte prioritário",
];

export function PricingSection({ onCTAClick }: PricingSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-background to-primary/5">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Escolha seu Plano{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PRO
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Invista no seu crescimento como artista
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card border rounded-2xl p-6 ${
                plan.recommended
                  ? "border-primary shadow-xl shadow-primary/20 scale-105"
                  : "border-border"
              }`}
            >
              {plan.recommended && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl font-bold">
                    R$ {plan.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-muted-foreground mb-1">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
                {plan.savings && (
                  <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-500 border-green-500/20">
                    {plan.savings}
                  </Badge>
                )}
              </div>

              <Button
                onClick={onCTAClick}
                className={`w-full ${
                  plan.recommended
                    ? "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                Assinar {plan.name}
              </Button>
            </div>
          ))}
        </div>

        {/* Features List */}
        <div className="max-w-xl mx-auto">
          <p className="text-center text-muted-foreground mb-4">
            Todos os planos incluem:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
