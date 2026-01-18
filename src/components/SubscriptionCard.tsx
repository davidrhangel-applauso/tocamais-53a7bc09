import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown, Check, Zap, Clock, AlertCircle, QrCode, Copy, Upload, Image, CheckCircle, Loader2 } from "lucide-react";
import QRCode from "qrcode";

interface SubscriptionCardProps {
  artistaId: string;
}

interface PixData {
  pix_code: string;
  pix_key: string;
  pix_name: string;
  price: number;
  subscription_id: string;
}

interface PendingReceipt {
  id: string;
  status: string;
  created_at: string;
}

export function SubscriptionCard({ artistaId }: SubscriptionCardProps) {
  const { isLoading, isPro, subscription, daysRemaining, refetch } = useSubscription(artistaId);
  const [isCreating, setIsCreating] = useState(false);
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [step, setStep] = useState<'pix' | 'upload' | 'waiting'>('pix');
  const [uploading, setUploading] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState<PendingReceipt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for pending receipt on mount
  useEffect(() => {
    const checkPendingReceipt = async () => {
      const { data } = await supabase
        .from('subscription_receipts')
        .select('id, status, created_at')
        .eq('artista_id', artistaId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setPendingReceipt(data);
      }
    };

    if (artistaId && !isPro) {
      checkPendingReceipt();
    }
  }, [artistaId, isPro]);

  const generateQRCode = async (code: string) => {
    try {
      const url = await QRCode.toDataURL(code, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrCodeDataUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleSubscribe = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-manual-subscription', {
        body: { artista_id: artistaId },
      });

      if (error) throw error;

      if (data.pix_code) {
        setPixData({
          pix_code: data.pix_code,
          pix_key: data.pix_key,
          pix_name: data.pix_name,
          price: data.price,
          subscription_id: data.subscription_id,
        });
        await generateQRCode(data.pix_code);
        setStep('pix');
        setShowPixDialog(true);
      }

      toast.success("Assinatura iniciada! Faça o Pix e envie o comprovante.");
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || "Erro ao criar assinatura");
    } finally {
      setIsCreating(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.pix_code) {
      navigator.clipboard.writeText(pixData.pix_code);
      toast.success("Código Pix copiado!");
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, envie uma imagem do comprovante");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${artistaId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Create receipt record
      const { error: receiptError } = await supabase
        .from('subscription_receipts')
        .insert({
          subscription_id: pixData?.subscription_id,
          artista_id: artistaId,
          receipt_url: urlData.publicUrl,
          status: 'pending',
        });

      if (receiptError) throw receiptError;

      toast.success("Comprovante enviado com sucesso!");
      setStep('waiting');
      setPendingReceipt({
        id: pixData?.subscription_id || '',
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      toast.error(error.message || "Erro ao enviar comprovante");
    } finally {
      setUploading(false);
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

  // Show pending receipt status
  if (pendingReceipt && !isPro) {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Aguardando Aprovação
              </CardTitle>
              <CardDescription>
                Seu comprovante está sendo analisado
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
              Pendente
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <Clock className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              Seu pagamento está sendo verificado pelo administrador. 
              Assim que for aprovado, seu plano Pro será ativado automaticamente.
            </AlertDescription>
          </Alert>
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

          {/* Botão de Ação */}
          {!isPro && (
            <Button 
              onClick={handleSubscribe} 
              disabled={isCreating}
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
                  Assinar Plano Pro - R$ 19,90/mês
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
              {step === 'pix' && <QrCode className="h-5 w-5" />}
              {step === 'upload' && <Upload className="h-5 w-5" />}
              {step === 'waiting' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {step === 'pix' && 'Pague via Pix'}
              {step === 'upload' && 'Enviar Comprovante'}
              {step === 'waiting' && 'Comprovante Enviado'}
            </DialogTitle>
            <DialogDescription>
              {step === 'pix' && `Escaneie o QR Code ou copie o código para pagar R$ ${pixData?.price?.toFixed(2) || '19,90'}`}
              {step === 'upload' && 'Envie uma foto ou print do comprovante de pagamento'}
              {step === 'waiting' && 'Seu pagamento está sendo analisado'}
            </DialogDescription>
          </DialogHeader>

          {step === 'pix' && (
            <div className="space-y-4">
              {qrCodeDataUrl && (
                <div className="flex justify-center">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code Pix" 
                    className="w-48 h-48 rounded-lg border"
                  />
                </div>
              )}
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Beneficiário: <strong>{pixData?.pix_name}</strong></p>
                <p>Valor: <strong>R$ {pixData?.price?.toFixed(2)}</strong></p>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={copyPixCode}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código Pix
              </Button>
              
              <Button 
                className="w-full" 
                onClick={() => setStep('upload')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Já paguei, enviar comprovante
              </Button>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              
              <Button 
                className="w-full h-32 flex flex-col gap-2" 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Image className="h-8 w-8" />
                    <span>Clique para selecionar o comprovante</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG até 5MB</span>
                  </>
                )}
              </Button>

              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setStep('pix')}
              >
                Voltar
              </Button>
            </div>
          )}

          {step === 'waiting' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Seu comprovante foi enviado com sucesso! O administrador irá analisar 
                e aprovar seu pagamento em breve. Você receberá uma notificação quando 
                seu plano Pro for ativado.
              </p>

              <Button 
                className="w-full" 
                onClick={() => {
                  setShowPixDialog(false);
                  refetch();
                }}
              >
                Entendi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}