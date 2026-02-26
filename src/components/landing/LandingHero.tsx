import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-concert.jpg";
import logoTocaMais from "@/assets/logo-tocamais.png";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useState } from "react";

interface LandingHeroProps {
  onArtistClick: () => void;
  onClientClick: () => void;
}

export function LandingHero({ onArtistClick, onClientClick }: LandingHeroProps) {
  const { canInstall, isIOS, install } = useInstallPrompt();
  const [showIOSHint, setShowIOSHint] = useState(false);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSHint(true);
    } else {
      install();
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background"></div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-12 sm:py-16 md:py-20">
        {/* Social Proof Badge */}
        <div className="animate-fade-in mb-6 sm:mb-8">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 text-sm font-medium">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            +500 artistas já usam o Toca+
          </Badge>
        </div>

        {/* Logo */}
        <div className="w-full max-w-3xl mx-auto mb-6 sm:mb-8 animate-scale-in rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/tLeo0JgrEr0?rel=0&modestbranding=1"
              title="Toca Mais - Vídeo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
          <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Transforme Seu Talento
          </span>
          <br />
          <span className="text-white">em Renda</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-3 sm:mb-4 animate-fade-in font-light max-w-3xl mx-auto leading-relaxed px-2">
          Receba gorjetas, pedidos de música e conecte-se com seu público
        </p>
        
        <p className="text-base sm:text-lg text-white/70 mb-8 sm:mb-10 md:mb-12 animate-fade-in max-w-2xl mx-auto px-2" style={{ animationDelay: '0.2s' }}>
          Teste grátis com <span className="text-green-400 font-semibold">até R$ 10 em gorjetas</span>. Com o PRO, receba ilimitado via PIX.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center animate-fade-in-up px-2" style={{ animationDelay: '0.4s' }}>
          <Button
            size="lg"
            className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 bg-gradient-to-r from-primary to-primary-glow hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 font-semibold shadow-xl w-full sm:w-auto group"
            onClick={onArtistClick}
          >
            Cadastrar como Artista
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          {/* Install button - only when supported */}
          {(canInstall || isIOS) && (
            <Button
              size="lg"
              variant="outline"
              className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 border-2 border-green-400/50 text-green-400 hover:bg-green-400/10 hover:border-green-400 transition-all duration-300 font-semibold w-full sm:w-auto gap-2"
              onClick={handleInstallClick}
            >
              <Download className="w-5 h-5" />
              Instalar App Grátis
            </Button>
          )}
        </div>

        {/* iOS install hint */}
        {showIOSHint && (
          <div className="mt-4 animate-fade-in bg-black/60 border border-green-400/30 rounded-xl px-4 py-3 max-w-sm mx-auto">
            <p className="text-sm text-green-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 shrink-0" />
              Toque em <strong>Compartilhar</strong> e depois <strong>"Adicionar à Tela Inicial"</strong>
            </p>
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-10 sm:mt-12 flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-3 text-base sm:text-lg text-white/90 font-medium">
            <span className="text-green-400 text-xl">✓</span>
            Cadastro gratuito
          </div>
          <div className="flex items-center gap-3 text-base sm:text-lg text-white/90 font-medium">
            <span className="text-green-400 text-xl">✓</span>
            Sem mensalidade obrigatória
          </div>
          <div className="flex items-center gap-3 text-base sm:text-lg text-white/90 font-medium">
            <span className="text-green-400 text-xl">✓</span>
            Pagamento via PIX
          </div>
          {(canInstall || isIOS) && (
            <div className="flex items-center gap-3 text-base sm:text-lg text-white/90 font-medium">
              <span className="text-green-400 text-xl">✓</span>
              Instale no celular, sem loja de apps
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
