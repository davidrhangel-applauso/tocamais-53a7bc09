import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";

interface SalesHeroProps {
  onCTAClick: () => void;
}

export function SalesHero({ onCTAClick }: SalesHeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/10">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container relative z-10 px-4 py-16 text-center">
        {/* Urgency Badge */}
        <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 px-4 py-2 text-sm animate-bounce">
          <Sparkles className="w-4 h-4 mr-2" />
          Oferta Especial - Tempo Limitado
        </Badge>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          Receba{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            100%
          </span>{" "}
          das Suas Gorjetas
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Zero taxa. Dinheiro direto na sua conta.
          <br />
          <span className="text-primary font-semibold">Sem intermediários.</span>
        </p>

        {/* Value Proposition */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-full px-6 py-3">
            <span className="text-green-500 font-bold">0%</span> de taxa
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-full px-6 py-3">
            PIX <span className="text-primary font-bold">direto</span> na conta
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-full px-6 py-3">
            Ativação <span className="text-accent font-bold">imediata</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={onCTAClick}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-10 py-7 text-xl font-bold rounded-full shadow-2xl shadow-primary/30 transform hover:scale-105 transition-all duration-300"
        >
          Assinar PRO Agora
          <ArrowRight className="ml-2 w-6 h-6" />
        </Button>

        {/* Trust Text */}
        <p className="mt-6 text-sm text-muted-foreground">
          Cancele quando quiser • Sem compromisso
        </p>
      </div>
    </section>
  );
}
