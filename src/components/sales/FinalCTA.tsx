import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap } from "lucide-react";

interface FinalCTAProps {
  onCTAClick: () => void;
}

export function FinalCTA({ onCTAClick }: FinalCTAProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/20 via-background to-accent/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/30 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Ativação Imediata
          </Badge>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Comece a Receber{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              100%
            </span>{" "}
            Hoje
          </h2>

          <p className="text-xl text-muted-foreground mb-8">
            Não deixe mais dinheiro na mesa. Cada show sem PRO é dinheiro perdido.
          </p>

          <Button
            size="lg"
            onClick={onCTAClick}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-12 py-7 text-xl font-bold rounded-full shadow-2xl shadow-primary/30 transform hover:scale-105 transition-all duration-300"
          >
            Assinar PRO Agora
            <ArrowRight className="ml-2 w-6 h-6" />
          </Button>

          <p className="mt-6 text-sm text-muted-foreground">
            A partir de R$ 19,90/mês • Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}
