import { Button } from "@/components/ui/button";
import { Music, ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-concert.jpg";

interface LandingHeroProps {
  onArtistClick: () => void;
  onClientClick: () => void;
}

export function LandingHero({ onArtistClick, onClientClick }: LandingHeroProps) {
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
        <div className="flex justify-center mb-6 sm:mb-8 animate-scale-in">
          <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary to-primary-glow rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-sm border border-primary/20">
            <Music className="w-12 h-12 sm:w-16 md:w-20 text-white animate-float" />
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
          Com o plano PRO, você recebe <span className="text-green-400 font-semibold">100% das gorjetas</span> direto na sua conta
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
        </div>

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
        </div>
      </div>
    </section>
  );
}
