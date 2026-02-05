import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SalesHero } from "@/components/sales/SalesHero";
import { ProblemSection } from "@/components/sales/ProblemSection";
import { SolutionSection } from "@/components/sales/SolutionSection";
import { SavingsCalculator } from "@/components/sales/SavingsCalculator";
import { ComparisonSection } from "@/components/sales/ComparisonSection";
import { TestimonialsSection } from "@/components/sales/TestimonialsSection";
import { PricingSection } from "@/components/sales/PricingSection";
import { GuaranteeSection } from "@/components/sales/GuaranteeSection";
import { SalesFAQ } from "@/components/sales/SalesFAQ";
import { FinalCTA } from "@/components/sales/FinalCTA";
import { StickyMobileCTA } from "@/components/sales/StickyMobileCTA";
import { SalesFooter } from "@/components/sales/SalesFooter";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProSales() {
  const navigate = useNavigate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      setIsLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCTAClick = () => {
    if (isAuthenticated) {
      // Se já está logado, abre o modal de upgrade
      setShowPremiumModal(true);
    } else {
      // Se não está logado, redireciona para auth com flag de upgrade
      navigate("/auth?upgrade=true");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <SalesHero onCTAClick={handleCTAClick} />

      {/* Problem Section */}
      <ProblemSection />

      {/* Solution Section */}
      <SolutionSection />

      {/* Savings Calculator */}
      <SavingsCalculator onCTAClick={handleCTAClick} />

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing */}
      <PricingSection onCTAClick={handleCTAClick} />

      {/* Guarantee */}
      <GuaranteeSection />

      {/* FAQ */}
      <SalesFAQ />

      {/* Final CTA */}
      <FinalCTA onCTAClick={handleCTAClick} />

      {/* Footer */}
      <SalesFooter />

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA onCTAClick={handleCTAClick} />

      {/* Subscription Modal */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Assine o Plano PRO
            </DialogTitle>
          </DialogHeader>
          {userId && <SubscriptionCard artistaId={userId} />}
          {!userId && (
            <p className="text-center text-muted-foreground py-4">
              Carregando informações...
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
