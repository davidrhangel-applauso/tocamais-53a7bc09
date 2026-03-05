import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { PaymentMethodDialog } from "@/components/PaymentMethodDialog";
import { PixSubscriptionDialog } from "@/components/PixSubscriptionDialog";
import { toast } from "sonner";
import { STRIPE_PLANS, type PlanKey } from "@/lib/stripe-plans";

export default function ProSales() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [autoCheckoutDone, setAutoCheckoutDone] = useState(false);
  const [pendingPlanKey, setPendingPlanKey] = useState<string | null>(null);
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>("anual");
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [artistaId, setArtistaId] = useState<string | null>(null);

  const planParamMap: Record<string, PlanKey> = {
    monthly: "mensal",
    annual: "anual",
    biennial: "bienal",
  };

  const priceIdToPlanParam: Record<string, string> = Object.entries(STRIPE_PLANS).reduce((acc, [key, plan]) => {
    const englishKey = key === "mensal" ? "monthly" : key === "anual" ? "annual" : "biennial";
    acc[plan.price_id] = englishKey;
    return acc;
  }, {} as Record<string, string>);

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

  // Handle checkout cancelled
  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled") {
      toast.info("Checkout cancelado. Escolha outro plano abaixo.");
      setTimeout(() => {
        document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, []);

  // Auto-checkout when arriving with a plan parameter
  useEffect(() => {
    if (isLoading || autoCheckoutDone || !isAuthenticated) return;
    const planParam = searchParams.get("plan");
    if (!planParam) return;
    const planKey = planParamMap[planParam];
    if (!planKey) return;
    setAutoCheckoutDone(true);
    handleCTAClick(STRIPE_PLANS[planKey].price_id);
  }, [isLoading, isAuthenticated, autoCheckoutDone]);

  const handleCTAClick = async (priceId?: string) => {
    if (!isAuthenticated) {
      const planName = priceId ? priceIdToPlanParam[priceId] || null : "annual";
      setPendingPlanKey(planName);
      setShowAuthDialog(true);
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
      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onConfirm={() => navigate(`/auth?upgrade=true${pendingPlanKey ? `&plan=${pendingPlanKey}` : ''}`)}
      />
    </div>
  );
}
