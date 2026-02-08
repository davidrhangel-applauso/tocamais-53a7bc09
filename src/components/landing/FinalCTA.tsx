import { Button } from "@/components/ui/button";
import { ArrowRight, Music } from "lucide-react";
import { Link } from "react-router-dom";

interface FinalCTAProps {
  onCTAClick: () => void;
}

export function FinalCTA({ onCTAClick }: FinalCTAProps) {
  return (
    <section className="relative py-20 sm:py-28 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15)_0%,transparent_70%)]"></div>
      
      {/* Floating elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-8 animate-float shadow-2xl shadow-primary/30">
          <Music className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
          Pronto para{" "}
          <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            começar?
          </span>
        </h2>
        
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Cadastre-se agora e comece a receber gorjetas e pedidos de música hoje mesmo
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg" 
            className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 font-semibold group"
            onClick={onCTAClick}
          >
            Cadastrar como Artista
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <p className="text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/auth" className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </section>
  );
}
