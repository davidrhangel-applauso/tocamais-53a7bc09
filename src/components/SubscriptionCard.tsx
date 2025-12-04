import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown, Check, Zap, Clock, AlertCircle, QrCode, Copy } from "lucide-react";

interface SubscriptionCardProps {
  artistaId: string;
  hasMercadoPagoLinked: boolean;
}

export function SubscriptionCard({ artistaId, hasMercadoPagoLinked }: SubscriptionCardProps) {
  const { isLoading, isPro, subscription, daysRemaining, refetch } = useSubscription(artistaId);
  const [isCreating, setIsCreating] = useState(false);
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_base64: string;
  } | null>(null);

  const handleSubscribe = async () => {
    if (!hasMercadoPagoLinked) {
      toast.error("Você precisa vincular sua conta do Mercado Pago primeiro para assinar o Plano Pro.");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { artista_id: artistaId },
      });

      if (error) throw error;

      if (data.qr_code) {
        setPixData({
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
        });
        setShowPixDialog(true);
      }

      toast.success("Assinatura criada! Pague o Pix para ativar o Plano Pro.");
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || "Erro ao criar assinatura");
    } finally {
      setIsCreating(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      toast.success("Código Pix copiado!");
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
    <>
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
            {/* Plano Free */}
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

            {/* Plano Pro */}
            <div className={`rounded-lg border p-4 space-y-3 ${isPro ? "border-primary bg-primary/5" : "bg-muted/30"}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-1">
                  <Crown className="h-4 w-4 text-primary" />
                  Pro
                </h3>
                {isPro && <Badge variant="default" className="text-xs">Atual</Badge>}
              </div>
              <p className="text-2xl font-bold">R$ 39,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
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
                  <span>Via MP vinculado</span>
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
                  {daysRemaining <= 7 && (
                    <Button size="sm" onClick={handleSubscribe} disabled={isCreating}>
                      Renovar
                    </Button>
                  )}
                </div>
                <Progress value={(daysRemaining / 30) * 100} className="h-1 mt-2" />
              </AlertDescription>
            </Alert>
          )}

          {/* Requisito: Vincular MP */}
          {!isPro && !hasMercadoPagoLinked && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para assinar o Plano Pro, você precisa primeiro vincular sua conta do Mercado Pago na seção abaixo.
              </AlertDescription>
            </Alert>
          )}

          {/* Botão de Ação */}
          {!isPro && (
            <Button 
              onClick={handleSubscribe} 
              disabled={isCreating || !hasMercadoPagoLinked}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Assinar Plano Pro - R$ 39,90/mês
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Pagamento Pix */}
      <Dialog open={showPixDialog} onOpenChange={setShowPixDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Pague para Ativar o Pro
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código Pix para pagar R$ 39,90
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pixData?.qr_code_base64 && (
              <div className="flex justify-center">
                <img 
                  src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                  alt="QR Code Pix" 
                  className="w-48 h-48"
                />
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={copyPixCode}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Código Pix
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Após o pagamento, seu plano será ativado automaticamente em alguns minutos.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
