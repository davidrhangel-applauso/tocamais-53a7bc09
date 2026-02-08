import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music, Search, Building2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { waitForProfile } from "@/lib/auth-utils";
import { PremiumOfferModal } from "@/components/PremiumOfferModal";
import heroImage from "@/assets/hero-concert.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await waitForProfile(session.user.id);
          
          if (profile) {
            switch (profile.tipo) {
              case "artista":
                navigate("/painel", { replace: true });
                return;
              case "estabelecimento":
                navigate("/painel-local", { replace: true });
                return;
              default:
                navigate("/home", { replace: true });
                return;
            }
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleContinueFree = () => {
    setShowPremiumModal(false);
    navigate("/auth");
  };

  const handleSelectPlan = (plan: "monthly" | "annual" | "biennial") => {
    setShowPremiumModal(false);
    navigate(`/auth?upgrade=true&plan=${plan}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Music className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-primary/20 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-accent shadow-2xl">
                <Music className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Toca+
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Conecte-se com artistas ao vivo. Peça músicas. Deixe gorjetas.
            </p>
          </div>

          {/* Main CTAs */}
          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all h-14 text-lg font-semibold"
              onClick={() => setShowPremiumModal(true)}
            >
              <Music className="mr-2 h-5 w-5" />
              Sou Artista
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full border-2 border-primary/50 hover:border-primary hover:bg-primary/10 h-14 text-lg font-semibold"
              onClick={() => navigate("/buscar")}
            >
              <Search className="mr-2 h-5 w-5" />
              Buscar Artistas
            </Button>
          </div>

          {/* Secondary Links */}
          <div className="space-y-3 pt-4">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/auth-estabelecimento")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Sou Estabelecimento
            </Button>

            <Button
              variant="link"
              className="text-primary hover:text-accent"
              onClick={() => navigate("/landing")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Conhecer o Toca+
            </Button>
          </div>
        </div>

        {/* Footer badge */}
        <div className="absolute bottom-6 text-center">
          <p className="text-xs text-muted-foreground/60">
            🎵 Música ao vivo, pedidos e gorjetas digitais
          </p>
        </div>
      </div>

      {/* Premium Offer Modal */}
      <PremiumOfferModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        onContinueFree={handleContinueFree}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
};

export default Index;
