import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown, Check, Zap, Clock, AlertCircle, Loader2, ExternalLink, Settings } from "lucide-react";
import { STRIPE_PLANS, type PlanKey } from "@/lib/stripe-plans";

interface SubscriptionCardProps {
  artistaId: string;
}

export function SubscriptionCard({ artistaId }: SubscriptionCardProps) {
  const { isLoading, isPro, subscription, daysRemaining } = useSubscription(artistaId);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("anual");
  const [isManaging, setIsManaging] = useState(false);

  const handleSubscribe = async () => {
    setIsCreating(true);
    try {
      const plan = STRIPE_PLANS[selectedPlan];
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: plan.price_id },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || "Erro ao iniciar pagamento");
    } finally {
      setIsCreating(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening portal:', error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setIsManaging(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isPro ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className={`h-5 w-5 ${isPro ? "text-primary" : "text-muted-foreground"}`} />
              Seu Plano
            </CardTitle>
            <CardDescription>
              Escolha como receber suas gorjetas
            </CardDescription>
          </div>
          <Badge variant={isPro ? "default" : "secondary"} className="text-sm">
            {isPro ? "Pro" : "Free"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comparativo de Planos */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-lg border p-4 space-y-3 ${!isPro ? "border-primary bg-primary/5" : "bg-muted/30"}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Free</h3>
              {!isPro && <Badge variant="outline" className="text-xs">Atual</Badge>}
            </div>
            <p className="text-2xl font-bold">R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-muted-foreground" />
                <span>Recebe gorjetas</span>
              </div>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Taxa de 20%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground ml-6">Você recebe 80%</span>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-4 space-y-3 ${isPro ? "border-primary bg-primary/5" : "bg-muted/30"}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-1">
                <Crown className="h-4 w-4 text-primary" />
                Pro
              </h3>
              {isPro && <Badge variant="default" className="text-xs">Atual</Badge>}
            </div>
            <p className="text-2xl font-bold">R$ 19,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Taxa 0%</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Recebe 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>PIX próprio direto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status da Assinatura Pro */}
        {isPro && subscription && daysRemaining !== null && (
          <Alert className="border-primary/50 bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Sua assinatura expira em <strong>{daysRemaining} dias</strong></span>
              </div>
              <Progress value={(daysRemaining / 30) * 100} className="h-1 mt-2" />
            </AlertDescription>
          </Alert>
        )}

        {isPro && daysRemaining === null && (
          <Alert className="border-primary/50 bg-primary/10">
            <Crown className="h-4 w-4 text-primary" />
            <AlertDescription>
              Plano PRO permanente ativo.
            </AlertDescription>
          </Alert>
        )}

        {/* Manage subscription for PRO users */}
        {isPro && (
          <Button
            onClick={handleManageSubscription}
            disabled={isManaging}
            variant="outline"
            className="w-full"
          >
            {isManaging ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Gerenciar Assinatura
          </Button>
        )}

        {/* Plan selection + subscribe for free users */}
        {!isPro && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-center">Escolha seu plano:</p>
            <div className="space-y-2">
              {(Object.keys(STRIPE_PLANS) as PlanKey[]).map((key) => {
                const plan = STRIPE_PLANS[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`w-full text-left rounded-lg border p-3 transition-all ${
                      selectedPlan === key
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{plan.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">{plan.description}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">
                          R$ {plan.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                    </div>
                    {plan.savings && (
                      <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                        {plan.savings}
                      </Badge>
                    )}
                    {plan.recommended && (
                      <Badge className="mt-1 ml-1 text-xs">Mais popular</Badge>
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={isCreating}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Assinar {STRIPE_PLANS[selectedPlan].name} - R$ {STRIPE_PLANS[selectedPlan].price.toFixed(2).replace(".", ",")}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
