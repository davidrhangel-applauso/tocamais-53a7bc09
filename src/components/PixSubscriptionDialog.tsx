import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generatePixQRCodeDataUrl, generatePixPayload } from "@/lib/pix-qr-generator";
import { STRIPE_PLANS, type PlanKey } from "@/lib/stripe-plans";
import { Copy, Upload, Check, Clock, QrCode, Loader2 } from "lucide-react";

interface PixSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planKey: PlanKey;
  artistaId: string;
}

const PLAN_DAYS: Record<PlanKey, number> = {
  mensal: 30,
  anual: 365,
  bienal: 730,
};

export function PixSubscriptionDialog({ open, onOpenChange, planKey, artistaId }: PixSubscriptionDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const plan = STRIPE_PLANS[planKey];

  useEffect(() => {
    if (open) {
      setSubmitted(false);
      fetchPixSettings();
    }
  }, [open, planKey]);

  const fetchPixSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-manual-subscription', {
        body: { artista_id: artistaId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Generate QR code with the plan price
      const payload = generatePixPayload({
        pixKey: data.pix_key,
        keyType: data.pix_key_type,
        merchantName: data.pix_name,
        merchantCity: data.pix_city,
        amount: plan.price,
        transactionId: `TOCA${data.subscription_id?.replace(/-/g, '').substring(0, 21) || '***'}`,
      });
      setPixCode(payload);

      const qrUrl = await generatePixQRCodeDataUrl({
        pixKey: data.pix_key,
        keyType: data.pix_key_type,
        merchantName: data.pix_name,
        merchantCity: data.pix_city,
        amount: plan.price,
        transactionId: `TOCA${data.subscription_id?.replace(/-/g, '').substring(0, 21) || '***'}`,
      });
      setQrCodeUrl(qrUrl);
    } catch (error: any) {
      console.error('Error generating PIX:', error);
      toast.error(error.message || 'Erro ao gerar código PIX');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!pixCode) return;
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      // Upload to receipts bucket
      const fileName = `${artistaId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Get active subscription for this artist
      const { data: sub } = await supabase
        .from('artist_subscriptions')
        .select('id')
        .eq('artista_id', artistaId)
        .in('status', ['pending_payment', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Update subscription with plano_tipo
      if (sub) {
        await supabase
          .from('artist_subscriptions')
          .update({ plano_tipo: planKey } as any)
          .eq('id', sub.id);
      }

      // Create receipt record
      const { error: receiptError } = await supabase
        .from('subscription_receipts')
        .insert({
          artista_id: artistaId,
          subscription_id: sub?.id || null,
          receipt_url: urlData.publicUrl,
          status: 'pending',
        });

      if (receiptError) throw receiptError;

      // Notify admins via edge function
      try {
        await supabase.functions.invoke('notify-admin-subscription', {
          body: { artista_id: artistaId, plan_name: plan.name },
        });
      } catch {
        // Non-critical, admin will still see in dashboard
      }

      setSubmitted(true);
      toast.success("Comprovante enviado com sucesso!");
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      toast.error("Erro ao enviar comprovante. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Pagar via PIX
          </DialogTitle>
          <DialogDescription>
            Plano {plan.name} — R$ {plan.price.toFixed(2).replace(".", ",")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : submitted ? (
          <div className="space-y-4 text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold">Comprovante enviado!</h3>
            <p className="text-muted-foreground text-sm">
              Seu pagamento será analisado e em até <strong>24 horas</strong> seu plano PRO será ativado.
            </p>
            <Alert className="border-primary/30 bg-primary/5">
              <Clock className="w-4 h-4 text-primary" />
              <AlertDescription className="text-sm">
                Você receberá uma notificação assim que seu plano for ativado.
              </AlertDescription>
            </Alert>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Entendido
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code */}
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="QR Code PIX" className="w-56 h-56 rounded-lg" />
              </div>
            )}

            {/* Copy code */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopyCode}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Código copiado!" : "Copiar código PIX"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Badge variant="secondary" className="mb-2">
                R$ {plan.price.toFixed(2).replace(".", ",")}
              </Badge>
              <p>Após pagar, envie o comprovante abaixo</p>
            </div>

            {/* Upload receipt */}
            <div className="relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleUploadReceipt}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                disabled={uploading}
              />
              <Button
                className="w-full gap-2"
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Enviando..." : "Enviar comprovante de pagamento"}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Seu plano será ativado em até 24h após a confirmação do pagamento.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
