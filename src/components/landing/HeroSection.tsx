import { Button } from "@/components/ui/button";
import { Music, ChevronDown, Sparkles, Building2, HelpCircle } from "lucide-react";
import heroImage from "@/assets/hero-concert.jpg";

interface HeroSectionProps {
  onArtistClick: () => void;
  onClientClick: () => void;
  onEstablishmentClick: () => void;
  onHelpClick: () => void;
}

export const HeroSection = ({
  onArtistClick,
  onClientClick,
  onEstablishmentClick,
  onHelpClick,
}: HeroSectionProps) => {
  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-12 sm:py-16 md:py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md rounded-full border border-primary/30 mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">Grátis para começar</span>
        </div>

        {/* Logo Icon */}
        <div className="flex justify-center mb-6 sm:mb-8 animate-scale-in">
          <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary to-primary-glow rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-sm border border-primary/20">
            <Music className="w-12 h-12 sm:w-16 md:w-20 text-white animate-float" />
          </div>
        </div>

        {/* Main Headline */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-5 md:mb-6 animate-fade-in-up bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent drop-shadow-2xl"
          style={{ textShadow: "0 0 40px rgba(168, 85, 247, 0.4)" }}
        >
          Toca+
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white mb-3 sm:mb-4 animate-fade-in font-light max-w-3xl mx-auto leading-relaxed drop-shadow-lg px-2">
          A ponte entre artistas e público
        </p>

        {/* Value Proposition */}
        <p
          className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 sm:mb-10 md:mb-12 animate-fade-in max-w-2xl mx-auto drop-shadow-lg px-2"
          style={{ animationDelay: "0.2s" }}
        >
          Peça músicas, envie gorjetas via PIX e apoie artistas independentes em tempo real
        </p>

        {/* Primary CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center animate-fade-in-up px-2"
          style={{ animationDelay: "0.4s" }}
        >
          <Button
            size="lg"
            className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 bg-gradient-to-r from-primary to-primary-glow hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 font-semibold shadow-xl w-full sm:w-auto"
            onClick={onArtistClick}
          >
            <Music className="mr-2 h-5 w-5" />
            Sou Artista
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 border-2 border-white/50 bg-white/20 backdrop-blur-md hover:bg-white/30 hover:border-white transition-all duration-300 hover:scale-105 font-semibold text-white shadow-xl w-full sm:w-auto"
            onClick={onClientClick}
          >
            Buscar Artista
          </Button>
        </div>

        {/* Secondary CTA for establishments */}
        <div className="mt-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <Button
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10 gap-2"
            onClick={onEstablishmentClick}
          >
            <Building2 className="h-4 w-4" />
            Sou Estabelecimento (Bar/Restaurante)
          </Button>
        </div>

        {/* Help Link */}
        <button
          onClick={onHelpClick}
          className="mt-6 inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <HelpCircle className="h-4 w-4" />
          Como funciona o app?
        </button>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer"
          onClick={scrollToContent}
        >
          <ChevronDown className="w-8 h-8 text-white/60 hover:text-white transition-colors" />
        </div>
      </div>
    </section>
  );
};
