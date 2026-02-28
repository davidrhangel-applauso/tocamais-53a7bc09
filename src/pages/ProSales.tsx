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
import { toast } from "sonner";
import { STRIPE_PLANS, type PlanKey } from "@/lib/stripe-plans";

export default function ProSales() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCTAClick = async (priceId?: string) => {
    if (!isAuthenticated) {
      navigate("/auth?upgrade=true");
      return;
    }

    // Default to annual plan
    const selectedPriceId = priceId || STRIPE_PLANS.anual.price_id;
    
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: selectedPriceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setIsCheckingOut(false);
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
      <SalesHero onCTAClick={() => handleCTAClick()} />
      <ProblemSection />
      <SolutionSection />
      <SavingsCalculator onCTAClick={() => handleCTAClick()} />
      <ComparisonSection />
      <TestimonialsSection />
      <PricingSection onCTAClick={handleCTAClick} />
      <GuaranteeSection />
      <SalesFAQ />
      <FinalCTA onCTAClick={() => handleCTAClick()} />
      <SalesFooter />
      <StickyMobileCTA onCTAClick={() => handleCTAClick()} />
    </div>
  );
}
