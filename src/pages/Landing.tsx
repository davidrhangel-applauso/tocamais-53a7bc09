import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { waitForProfile } from "@/lib/auth-utils";
import { PremiumOfferModal } from "@/components/PremiumOfferModal";
import { LandingHero } from "@/components/landing/LandingHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ArtistBenefits } from "@/components/landing/ArtistBenefits";
import { PlanComparison } from "@/components/landing/PlanComparison";
import { SavingsCalculator } from "@/components/sales/SavingsCalculator";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingCards } from "@/components/landing/PricingCards";
import { ForClients } from "@/components/landing/ForClients";
import { ForEstablishments } from "@/components/landing/ForEstablishments";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { StickyMobileCTA } from "@/components/sales/StickyMobileCTA";

const Landing = () => {
  const navigate = useNavigate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
      } else {
        console.error("User exists but profile not found");
        await supabase.auth.signOut();
      }
    }
  };

  const handleArtistClick = () => {
    setShowPremiumModal(true);
  };

  const handleClientClick = () => {
    navigate("/buscar");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <LandingHero 
        onArtistClick={handleArtistClick} 
        onClientClick={handleClientClick} 
      />

      {/* How It Works */}
      <HowItWorks onCTAClick={handleArtistClick} />

      {/* Artist Benefits */}
      <ArtistBenefits />

      {/* Plan Comparison */}
      <PlanComparison 
        onProClick={handleArtistClick} 
        onFreeClick={() => navigate("/auth")} 
      />

      {/* Savings Calculator */}
      <SavingsCalculator onCTAClick={handleArtistClick} />

      {/* Testimonials */}
      <Testimonials />

      {/* Pricing Cards */}
      <PricingCards onSelectPlan={handleSelectPlan} />

      {/* For Clients */}
      <ForClients />

      {/* For Establishments */}
      <ForEstablishments />

      {/* FAQ */}
      <LandingFAQ />

      {/* Final CTA */}
      <FinalCTA onCTAClick={handleArtistClick} />

      {/* Footer */}
      <LandingFooter />

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA onCTAClick={handleArtistClick} />

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

export default Landing;
