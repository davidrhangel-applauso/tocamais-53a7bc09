import { Check, X, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlanComparisonProps {
  onProClick: () => void;
  onFreeClick: () => void;
}

const features = [
  { name: "Receber gorjetas", free: true, pro: true },
  { name: "Pedidos de música", free: true, pro: true },
  { name: "Perfil de artista", free: true, pro: true },
  { name: "QR Code básico", free: true, pro: true },
  { name: "Taxa da plataforma", free: "20%", pro: "0%" },
  { name: "PIX direto na sua conta", free: false, pro: true },
  { name: "QR Code personalizado", free: false, pro: true },
  { name: "Destaque na busca", free: false, pro: true },
  { name: "Analytics completo", free: false, pro: true },
  { name: "Suporte prioritário", free: false, pro: true },
];

export function PlanComparison({ onProClick, onFreeClick }: PlanComparisonProps) {
  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
            🎯 Oferta Especial - Válida por Tempo Limitado
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Escolha Seu Plano
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Assine Anual e Ganhe 2 Meses Grátis (Economize <span className="font-bold text-green-400">R$ 139,80</span>)
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl relative overflow-visible">
          {/* Badge posicionado fora do grid para não ser cortado pelo overflow-hidden */}
          <Badge className="absolute top-0 right-[calc(100%/6)] translate-x-1/2 -translate-y-1/2 bg-green-500 text-white border-0 z-10 px-4 py-2 font-bold animate-pulse">
            ⭐ Recomendado
          </Badge>
          {/* Header */}
          <div className="grid grid-cols-3 rounded-t-2xl overflow-hidden bg-gradient-to-b from-muted/50 to-background">
            <div className="p-4 sm:p-6 bg-muted/50"></div>
            <div className="p-4 sm:p-6 text-center border-l border-border bg-muted/40">
              <p className="font-bold text-lg sm:text-xl text-foreground">Free</p>
              <p className="text-muted-foreground text-sm">R$ 0</p>
            </div>
            <div className="p-4 sm:p-6 text-center border-l border-primary bg-gradient-to-br from-primary/20 to-accent/20 relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary animate-bounce" />
                <p className="font-bold text-lg sm:text-xl text-primary">PRO</p>
              </div>
              <div>
                <p className="text-primary text-sm font-semibold">A partir de R$ 19,90/mês</p>
                <p className="text-xs text-green-400 font-bold">Economize R$139,80/ano</p>
              </div>
            </div>
          </div>

          {/* Features */}
          {features.map((feature, index) => (
            <div
              key={index}
              className="grid grid-cols-3 border-t border-border"
            >
              <div className="p-3 sm:p-4 flex items-center">
                <span className="font-medium text-sm sm:text-base">{feature.name}</span>
              </div>
              <div className="p-3 sm:p-4 flex items-center justify-center border-l border-border">
                {typeof feature.free === "boolean" ? (
                  feature.free ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground/50" />
                  )
                ) : (
                  <span className="text-destructive font-bold text-lg">{feature.free}</span>
                )}
              </div>
              <div className="p-3 sm:p-4 flex items-center justify-center border-l border-primary/30 bg-primary/5">
                {typeof feature.pro === "boolean" ? (
                  feature.pro ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground/50" />
                  )
                ) : (
                  <span className="text-green-500 font-bold text-lg">{feature.pro}</span>
                )}
              </div>
            </div>
          ))}

          {/* CTAs */}
          <div className="grid grid-cols-3 border-t border-border">
            <div className="p-4 sm:p-6"></div>
            <div className="p-4 sm:p-6 border-l border-border">
              <Button
                variant="outline"
                className="w-full hover:bg-muted/50"
                onClick={onFreeClick}
              >
                Começar Grátis
              </Button>
            </div>
            <div className="p-4 sm:p-6 border-l border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10">
              <Button
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 font-bold text-base shadow-lg hover:shadow-primary/50"
                onClick={onProClick}
              >
                <Crown className="w-4 h-4 mr-2" />
                Assinar PRO Agora
              </Button>
              <p className="text-xs text-center text-green-400 font-bold mt-3">
                Economize R$ 481/ano
              </p>
            </div>
          </div>
        </div>

        {/* ROI Message */}
        <div className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6 text-center">
          <p className="text-lg">
            💡 Se você recebe <span className="font-bold">R$ 100/mês</span> em gorjetas, 
            o PRO <span className="text-primary font-bold">se paga em 1 show!</span>
          </p>
        </div>
      </div>
    </section>
  );
}
