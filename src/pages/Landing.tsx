import { Button } from "@/components/ui/button";
import { Music, Heart, Star, Users, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-concert.jpg";
import { waitForProfile } from "@/lib/auth-utils";
import { NearbyArtists } from "@/components/NearbyArtists";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Wait for profile with retry logic
      const profile = await waitForProfile(user.id, 5, 500);
      
      // Only redirect if profile exists
      if (profile?.tipo) {
        navigate(profile.tipo === "artista" ? "/painel" : "/home", { replace: true });
      } else {
        console.error("User exists but profile not found");
        // Sign out user if profile doesn't exist
        await supabase.auth.signOut();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Help Button - Fixed */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background shadow-lg"
        onClick={() => navigate("/instrucoes")}
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Como usar
      </Button>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-12 sm:py-16 md:py-20">
          <div className="flex justify-center mb-6 sm:mb-8 animate-scale-in">
            <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary to-primary-glow rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-sm border border-primary/20">
              <Music className="w-12 h-12 sm:w-16 md:w-20 text-white animate-float" />
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-5 md:mb-6 animate-fade-in-up bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent drop-shadow-2xl" style={{ textShadow: '0 0 40px rgba(168, 85, 247, 0.4)' }}>
            Toca+
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white mb-3 sm:mb-4 animate-fade-in font-light max-w-3xl mx-auto leading-relaxed drop-shadow-lg px-2">
            Conecte-se com artistas e música ao vivo
          </p>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 sm:mb-10 md:mb-12 animate-fade-in max-w-2xl mx-auto drop-shadow-lg px-2" style={{ animationDelay: '0.2s' }}>
            Peça suas músicas favoritas e apoie artistas independentes de forma direta e segura
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center animate-fade-in-up px-2" style={{ animationDelay: '0.4s' }}>
            <Button
              size="lg"
              className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 bg-gradient-to-r from-primary to-primary-glow hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 font-semibold shadow-xl w-full sm:w-auto"
              onClick={() => navigate("/auth")}
            >
              Sou Artista
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 border-2 border-white/50 bg-white/20 backdrop-blur-md hover:bg-white/30 hover:border-white transition-all duration-300 hover:scale-105 font-semibold text-white shadow-xl w-full sm:w-auto"
              onClick={() => navigate("/buscar")}
            >
              Sou Cliente
            </Button>
          </div>
        </div>
      </section>

      {/* Nearby Artists Section */}
      <NearbyArtists />

      {/* Features Section */}
      <section className="py-16 sm:py-24 md:py-32 px-4 bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent px-2">
              Como Funciona
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              Simples, rápido e direto. Conecte-se com a música que você ama.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group relative bg-card border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-primary to-primary-glow rounded-xl sm:rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Music className="w-12 h-12 sm:w-14 md:w-16 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center group-hover:text-primary transition-colors">Peça Músicas</h3>
                <p className="text-muted-foreground text-center text-base sm:text-lg leading-relaxed">
                  Envie pedidos de músicas diretamente para seus artistas favoritos durante apresentações ao vivo.
                </p>
              </div>
            </div>

            <div className="group relative bg-card border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-accent to-primary-glow rounded-xl sm:rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Heart className="w-12 h-12 sm:w-14 md:w-16 text-accent-foreground" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center group-hover:text-accent transition-colors">Envie Gorjetas</h3>
                <p className="text-muted-foreground text-center text-base sm:text-lg leading-relaxed">
                  Apoie artistas independentes enviando gorjetas via Pix de forma rápida e segura.
                </p>
              </div>
            </div>

            <div className="group relative bg-card border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 sm:col-span-2 md:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-primary-glow to-accent rounded-xl sm:rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Star className="w-12 h-12 sm:w-14 md:w-16 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center group-hover:text-primary transition-colors">Destaque Artistas</h3>
                <p className="text-muted-foreground text-center text-base sm:text-lg leading-relaxed">
                  Artistas podem ganhar destaque na plataforma e alcançar mais público.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10"></div>
        <div className="absolute inset-0 bg-[image:radial-gradient(circle_at_center,hsl(var(--primary)/0.1)_0%,transparent_100%)]"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary to-accent rounded-2xl sm:rounded-3xl shadow-2xl animate-float">
              <Users className="w-12 h-12 sm:w-16 md:w-20 text-primary-foreground" />
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent px-2">
            Pronto para Começar?
          </h2>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
            Junte-se a centenas de artistas e fãs que já estão usando o Toca+
          </p>
          
          <Button 
            size="lg" 
            className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 font-semibold w-full sm:w-auto"
            onClick={() => navigate("/auth")}
          >
            Criar Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 py-8 sm:py-10 md:py-12 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-full">
              <Music className="w-6 h-6 sm:w-8 md:h-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg mb-2">2025 Toca+</p>
          <p className="text-xs sm:text-sm text-muted-foreground/80 px-4">Conectando artistas e público através da música</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
