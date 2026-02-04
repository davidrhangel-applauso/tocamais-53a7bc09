import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
}

const features: PricingFeature[] = [
  { name: "Receber pedidos de música", free: true, pro: true },
  { name: "Receber gorjetas via PIX", free: true, pro: true },
  { name: "Perfil público", free: true, pro: true },
  { name: "QR Code personalizado", free: true, pro: true },
  { name: "Taxa da plataforma", free: "15%", pro: "7%" },
  { name: "Destaque na busca", free: false, pro: true },
  { name: "Analytics avançados", free: false, pro: true },
  { name: "Badge PRO no perfil", free: false, pro: true },
  { name: "Suporte prioritário", free: false, pro: true },
];

interface PricingColumnProps {
  title: string;
  price: string;
  period: string;
  isPro?: boolean;
  features: PricingFeature[];
  onSelect: () => void;
  buttonText: string;
}

const PricingColumn = ({
  title,
  price,
  period,
  isPro = false,
  features,
  onSelect,
  buttonText,
}: PricingColumnProps) => (
  <div
    className={`relative p-6 sm:p-8 rounded-2xl border ${
      isPro
        ? "bg-gradient-to-b from-primary/10 to-accent/5 border-primary/30 shadow-xl shadow-primary/10"
        : "bg-card border-border"
    }`}
  >
    {isPro && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-accent rounded-full">
        <span className="text-xs font-semibold text-primary-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          MAIS POPULAR
        </span>
      </div>
    )}

    <div className="text-center mb-6">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-bold">{price}</span>
        {period && <span className="text-muted-foreground">/{period}</span>}
      </div>
    </div>

    <ul className="space-y-3 mb-8">
      {features.map((feature, index) => {
        const value = isPro ? feature.pro : feature.free;
        const isIncluded = value === true;
        const isExcluded = value === false;

        return (
          <li key={index} className="flex items-center gap-3">
            {isExcluded ? (
              <X className="w-5 h-5 text-muted-foreground/50 shrink-0" />
            ) : (
              <Check
                className={`w-5 h-5 shrink-0 ${isPro ? "text-primary" : "text-live"}`}
              />
            )}
            <span
              className={`text-sm ${isExcluded ? "text-muted-foreground/50" : ""}`}
            >
              {feature.name}
              {typeof value === "string" && (
                <span
                  className={`ml-1 font-semibold ${
                    isPro ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  ({value})
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>

    <Button
      className={`w-full ${
        isPro
          ? "bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg hover:shadow-primary/30"
          : ""
      }`}
      variant={isPro ? "default" : "outline"}
      size="lg"
      onClick={onSelect}
    >
      {buttonText}
    </Button>
  </div>
);

interface PricingComparisonProps {
  onSelectFree: () => void;
  onSelectPro: () => void;
}

export const PricingComparison = ({
  onSelectFree,
  onSelectPro,
}: PricingComparisonProps) => {
  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Escolha Seu Plano
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece grátis e faça upgrade quando quiser
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <PricingColumn
            title="Gratuito"
            price="R$ 0"
            period=""
            features={features}
            onSelect={onSelectFree}
            buttonText="Começar Grátis"
          />
          <PricingColumn
            title="PRO"
            price="R$ 29,90"
            period="mês"
            isPro
            features={features}
            onSelect={onSelectPro}
            buttonText="Assinar PRO"
          />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          * Economize 50% nas taxas com o plano PRO. Cancele quando quiser.
        </p>
      </div>
    </section>
  );
};
