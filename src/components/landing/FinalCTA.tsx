import { Button } from "@/components/ui/button";
import { Music, ArrowRight, Sparkles } from "lucide-react";

interface FinalCTAProps {
  onArtistClick: () => void;
  onClientClick: () => void;
}

export const FinalCTA = ({ onArtistClick, onClientClick }: FinalCTAProps) => {
  return (
    <section className="relative py-20 sm:py-28 px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
      <div className="absolute inset-0 bg-[image:radial-gradient(circle_at_center,hsl(var(--primary)/0.15)_0%,transparent_70%)]" />
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-10 right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "1s" }}
      />

      <div className="container mx-auto max-w-4xl text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md rounded-full border border-primary/30 mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Junte-se a centenas de artistas</span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="p-5 sm:p-6 bg-gradient-to-br from-primary to-accent rounded-3xl shadow-2xl animate-float">
            <Music className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
          Pronto para Transformar Seus Shows?
        </h2>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Comece agora mesmo e veja suas gorjetas aumentarem. 
          Cadastro gratuito, sem compromisso.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-primary-glow hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 font-semibold"
            onClick={onArtistClick}
          >
            Criar Conta Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-10 py-7 border-2 hover:bg-primary/10 transition-all duration-300 hover:scale-105 font-semibold"
            onClick={onClientClick}
          >
            Buscar Artistas
          </Button>
        </div>

        {/* Trust Text */}
        <p className="text-sm text-muted-foreground mt-8">
          ✓ Sem taxa de adesão ✓ Cancele quando quiser ✓ Suporte em português
        </p>
      </div>
    </section>
  );
};
