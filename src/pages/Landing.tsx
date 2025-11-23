import { Button } from "@/components/ui/button";
import { Music, Heart, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-concert.jpg";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tipo")
        .eq("id", user.id)
        .single();

      navigate(profile?.tipo === "artista" ? "/painel" : "/home");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/20 rounded-full backdrop-blur-sm">
              <Music className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient animate-fade-in">
            Toca+
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-8 animate-fade-in">
            Conecte-se com artistas e música ao vivo. Peça suas músicas favoritas e apoie artistas independentes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Sou Artista
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-primary/10 rounded-full">
                  <Music className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Peça Músicas</h3>
              <p className="text-muted-foreground">
                Envie pedidos de músicas diretamente para seus artistas favoritos durante apresentações ao vivo.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-accent/10 rounded-full">
                  <Heart className="w-12 h-12 text-accent" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Envie Gorjetas</h3>
              <p className="text-muted-foreground">
                Apoie artistas independentes enviando gorjetas via Pix de forma rápida e segura.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-accent/10 rounded-full">
                  <Star className="w-12 h-12 text-accent" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Destaque Artistas</h3>
              <p className="text-muted-foreground">
                Artistas podem ganhar destaque na plataforma e alcançar mais público.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <Users className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">Pronto para Começar?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a centenas de artistas e fãs que já estão usando o Toca+
          </p>
          <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
            Criar Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Toca+. Conectando artistas e público.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
