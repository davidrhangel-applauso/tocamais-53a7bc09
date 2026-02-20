import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Crown, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueFree: () => void;
  onSelectPlan: (plan: "monthly" | "annual" | "biennial") => void;
}

const plans = [
  {
    id: "monthly" as const,
    name: "Mensal",
    price: 19.90,
    period: "/mês",
    totalPrice: null,
    savings: null,
    popular: false,
  },
  {
    id: "annual" as const,
    name: "Anual",
    price: 99.00,
    period: "/ano",
    monthlyEquivalent: 8.25,
    savings: "Economize R$ 139,80",
    popular: true,
  },
  {
    id: "biennial" as const,
    name: "Bienal",
    price: 169.90,
    period: "/2 anos",
    monthlyEquivalent: 7.08,
    savings: "Economize R$ 308,50",
    popular: false,
    bestValue: true,
  },
];

const benefits = [
  "Gorjetas ilimitadas via PIX (Free: até R$ 10)",
  "0% de taxa — tudo direto na sua conta",
  "Destaque nos resultados de busca",
  "Analytics completo de performance",
  "Suporte prioritário",
  "Sem limite de pedidos de música",
];

export function PremiumOfferModal({
  open,
  onOpenChange,
  onContinueFree,
  onSelectPlan,
}: PremiumOfferModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual" | "biennial">("annual");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 p-6 pb-8 text-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-6 h-6" />
              <span className="font-bold text-lg">Plano PRO</span>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-bold mb-2">
              Maximize seus ganhos!
            </DialogTitle>
            <p className="text-black/80 text-sm sm:text-base">
              Desbloqueie todos os recursos e receba seus pagamentos diretamente.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Plans grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "relative cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                  selectedPlan === plan.id
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2">
                    Mais Popular
                  </Badge>
                )}
                {plan.bestValue && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-2">
                    Melhor Valor
                  </Badge>
                )}
                <CardContent className="p-3 sm:p-4 text-center">
                  <h3 className="font-semibold text-sm mb-1">{plan.name}</h3>
                  <div className="mb-1">
                    <span className="text-2xl sm:text-3xl font-bold">
                      R$ {plan.price.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.monthlyEquivalent && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      = R$ {plan.monthlyEquivalent.toFixed(2).replace(".", ",")}/mês
                    </p>
                  )}
                  {plan.savings && (
                    <Badge variant="secondary" className="mt-2 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {plan.savings}
                    </Badge>
                  )}
                  <div className={cn(
                    "mt-3 w-5 h-5 rounded-full border-2 mx-auto flex items-center justify-center transition-colors",
                    selectedPlan === plan.id 
                      ? "border-primary bg-primary" 
                      : "border-muted-foreground/30"
                  )}>
                    {selectedPlan === plan.id && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Benefícios do Plano PRO
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => onSelectPlan(selectedPlan)}
            >
              <Crown className="w-5 h-5 mr-2" />
              Assinar PRO - R$ {plans.find(p => p.id === selectedPlan)?.price.toFixed(2).replace(".", ",")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full border-2 border-primary/50 hover:border-primary hover:bg-primary/10 font-medium"
              onClick={onContinueFree}
            >
              Continuar para login
            </Button>
          </div>

          {/* Trust badges */}
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
            🔒 Pagamento seguro via PIX • Cancele quando quiser
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
