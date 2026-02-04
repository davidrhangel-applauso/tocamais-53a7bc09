import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { waitForProfile } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Music, Users, Building2, HelpCircle, Sparkles } from "lucide-react";
import { PremiumOfferModal } from "@/components/PremiumOfferModal";

const Index = () => {
  const navigate = useNavigate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const profile = await waitForProfile(user.id, 5, 500);
      
      if (profile?.tipo) {
        if (profile.tipo === "artista") {
          navigate("/painel", { replace: true });
        } else if (profile.tipo === "estabelecimento") {
          navigate("/painel-local", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
        return;
      } else {
        console.error("User exists but profile not found");
        await supabase.auth.signOut();
      }
    }
    setIsLoading(false);
  };

  const handleArtistClick = () => {
    setShowPremiumModal(true);
  };

  const handleClientClick = () => {
    navigate("/buscar");
  };

  const handleEstablishmentClick = () => {
    navigate("/auth-estabelecimento");
  };

  const handleHelpClick = () => {
    navigate("/instrucoes");
  };

  const handleContinueFree = () => {
    setShowPremiumModal(false);
    navigate("/auth");
  };

  const handleSelectPlan = (plan: "monthly" | "annual" | "biennial") => {
    sessionStorage.setItem("selectedPremiumPlan", plan);
    setShowPremiumModal(false);
    navigate("/auth?upgrade=true");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Music className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg">
            <Music className="w-8 h-8 text-primary-foreground" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Toca+
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 max-w-lg">
          Conectando <span className="text-primary">artistas</span> e{" "}
          <span className="text-accent">público</span>
        </h1>
        <p className="text-muted-foreground text-center mb-10 max-w-md">
          Peça músicas, envie gorjetas e apoie artistas independentes
        </p>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <Button
            size="lg"
            className="w-full py-6 bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg font-semibold text-lg"
            onClick={handleArtistClick}
          >
            <Music className="mr-2 h-5 w-5" />
            Sou Artista
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full py-6 border-2 font-semibold text-lg"
            onClick={handleClientClick}
          >
            <Users className="mr-2 h-5 w-5" />
            Buscar Artistas
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="w-full py-6 font-semibold"
            onClick={handleEstablishmentClick}
          >
            <Building2 className="mr-2 h-5 w-5" />
            Sou Estabelecimento
          </Button>
        </div>

        {/* Landing Page Link */}
        <Button
          variant="link"
          className="mt-8 text-primary"
          onClick={() => navigate("/landing")}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Conheça mais sobre o Toca+
        </Button>
      </div>

      {/* Help Button */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={handleHelpClick}
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Como funciona?
        </Button>
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
