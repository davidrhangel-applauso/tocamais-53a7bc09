import { Button } from "@/components/ui/button";
import { Music, Heart, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-concert.jpg";
import { waitForProfile } from "@/lib/auth-utils";

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
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-[image:var(--gradient-hero)]"></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-20">
          <div className="flex justify-center mb-8 animate-scale-in">
            <div className="p-6 bg-gradient-to-br from-primary to-primary-glow rounded-3xl shadow-2xl backdrop-blur-sm border border-primary/20">
              <Music className="w-20 h-20 text-primary-foreground animate-float" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-fade-in-up bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Toca+
          </h1>
          
          <p className="text-xl md:text-3xl text-foreground mb-4 animate-fade-in font-light max-w-3xl mx-auto leading-relaxed">
            Conecte-se com artistas e música ao vivo
          </p>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 animate-fade-in max-w-2xl mx-auto" style={{ animationDelay: '0.2s' }}>
            Peça suas músicas favoritas e apoie artistas independentes de forma direta e segura
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Button
              size="lg"
              className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-primary-glow hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 font-semibold"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-7 border-2 border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105 font-semibold"
              onClick={() => navigate("/auth")}
            >
              Sou Artista
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Como Funciona
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simples, rápido e direto. Conecte-se com a música que você ama.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative bg-card border border-border rounded-3xl p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                <div className="flex justify-center mb-8">
                  <div className="p-8 bg-gradient-to-br from-primary to-primary-glow rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Music className="w-16 h-16 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-center group-hover:text-primary transition-colors">Peça Músicas</h3>
                <p className="text-muted-foreground text-center text-lg leading-relaxed">
                  Envie pedidos de músicas diretamente para seus artistas favoritos durante apresentações ao vivo.
                </p>
              </div>
            </div>

            <div className="group relative bg-card border border-border rounded-3xl p-8 hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                <div className="flex justify-center mb-8">
                  <div className="p-8 bg-gradient-to-br from-accent to-primary-glow rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Heart className="w-16 h-16 text-accent-foreground" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-center group-hover:text-accent transition-colors">Envie Gorjetas</h3>
                <p className="text-muted-foreground text-center text-lg leading-relaxed">
                  Apoie artistas independentes enviando gorjetas via Pix de forma rápida e segura.
                </p>
              </div>
            </div>

            <div className="group relative bg-card border border-border rounded-3xl p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                <div className="flex justify-center mb-8">
                  <div className="p-8 bg-gradient-to-br from-primary-glow to-accent rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Star className="w-16 h-16 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-center group-hover:text-primary transition-colors">Destaque Artistas</h3>
                <p className="text-muted-foreground text-center text-lg leading-relaxed">
                  Artistas podem ganhar destaque na plataforma e alcançar mais público.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10"></div>
        <div className="absolute inset-0 bg-[image:radial-gradient(circle_at_center,hsl(var(--primary)/0.1)_0%,transparent_100%)]"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-gradient-to-br from-primary to-accent rounded-3xl shadow-2xl animate-float">
              <Users className="w-20 h-20 text-primary-foreground" />
            </div>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
            Pronto para Começar?
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Junte-se a centenas de artistas e fãs que já estão usando o Toca+
          </p>
          
          <Button 
            size="lg" 
            className="text-lg px-12 py-8 bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 text-xl font-semibold"
            onClick={() => navigate("/auth")}
          >
            Criar Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 py-12 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Music className="w-8 h-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground text-lg mb-2">&copy; 2025 Toca+</p>
          <p className="text-sm text-muted-foreground/80">Conectando artistas e público através da música</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
