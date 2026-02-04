import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { waitForProfile } from "@/lib/auth-utils";

import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofStats } from "@/components/landing/SocialProofStats";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { PricingComparison } from "@/components/landing/PricingComparison";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
import { NearbyArtists } from "@/components/NearbyArtists";
import { PremiumOfferModal } from "@/components/PremiumOfferModal";

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

  const handleSelectPro = () => {
    setShowPremiumModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection
        onArtistClick={handleArtistClick}
        onClientClick={handleClientClick}
        onEstablishmentClick={handleEstablishmentClick}
        onHelpClick={handleHelpClick}
      />

      {/* Social Proof Stats */}
      <SocialProofStats />

      {/* Nearby Artists */}
      <NearbyArtists />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* Pricing Comparison */}
      <PricingComparison
        onSelectFree={handleContinueFree}
        onSelectPro={handleSelectPro}
      />

      {/* FAQ Section */}
      <div id="faq">
        <FAQSection />
      </div>

      {/* Final CTA */}
      <FinalCTA
        onArtistClick={handleArtistClick}
        onClientClick={handleClientClick}
      />

      {/* Footer */}
      <LandingFooter />

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA onArtistClick={handleArtistClick} />

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
