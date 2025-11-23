import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Copy, Check, Loader2, XCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "./ui/alert";

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gorjetaId: string;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
}

export const PixPaymentDialog = ({
  open,
  onOpenChange,
  gorjetaId,
  qrCode,
  qrCodeBase64,
  expiresAt,
}: PixPaymentDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'expired'>('pending');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [checking, setChecking] = useState(false);

  // Calcular tempo restante
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setStatus('expired');
        setTimeRemaining('Expirado');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!open || status !== 'pending') return;

    let attempts = 0;
    const maxAttempts = 200; // 10 minutos (3s * 200)

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        console.log('Max polling attempts reached');
        return;
      }

      attempts++;
      setChecking(true);

      try {
        const url = `check-payment-status?gorjeta_id=${gorjetaId}`;
        const { data, error } = await supabase.functions.invoke(url);

        if (error) {
          console.error('Error checking payment status:', error);
          return;
        }

        console.log('Payment status:', data);

        if (data.status === 'approved') {
          setStatus('approved');
          toast({
            title: "Pagamento Confirmado!",
            description: "Sua gorjeta foi recebida com sucesso.",
          });
        } else if (data.status === 'rejected') {
          setStatus('rejected');
          toast({
            title: "Pagamento Recusado",
            description: "O pagamento não foi aprovado.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error in polling:', error);
      } finally {
        setChecking(false);
      }
    };

    // Verificar imediatamente
    checkStatus();

    // Continuar verificando a cada 3 segundos
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [open, status, gorjetaId, toast]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app de pagamento Pix",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-12 h-12 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-12 h-12 text-destructive" />;
      case 'expired':
        return <XCircle className="w-12 h-12 text-muted-foreground" />;
      default:
        return <Loader2 className="w-12 h-12 animate-spin text-primary" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'approved':
        return {
          title: "Pagamento Confirmado!",
          description: "Sua gorjeta foi recebida pelo artista.",
        };
      case 'rejected':
        return {
          title: "Pagamento Recusado",
          description: "O pagamento não foi aprovado. Tente novamente.",
        };
      case 'expired':
        return {
          title: "QR Code Expirado",
          description: "O tempo limite foi atingido. Gere um novo QR Code.",
        };
      default:
        return {
          title: "Aguardando Pagamento",
          description: "Escaneie o QR Code ou copie o código Pix",
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{statusInfo.title}</DialogTitle>
            <Badge variant="outline" className="text-xs">
              Modo Teste
            </Badge>
          </div>
          <DialogDescription>{statusInfo.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {getStatusIcon()}

          {status === 'pending' && (
            <Alert variant="default" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Este QR Code é de teste e pode não ser reconhecido por aplicativos bancários reais. 
                Para pagamentos reais, configure um token de produção do Mercado Pago.
              </AlertDescription>
            </Alert>
          )}

          {status === 'pending' && qrCodeBase64 && (
            <>
              {/* QR Code */}
              <div className="relative">
                {qrCodeBase64 && (
                  <div className="p-4 bg-white rounded-lg">
                    <img
                      src={`data:image/png;base64,${qrCodeBase64}`}
                      alt="QR Code Pix"
                      className="w-64 h-64"
                    />
                  </div>
                )}
              </div>

              {/* Código Pix Copia e Cola */}
              <div className="w-full space-y-2">
                <label className="text-sm font-medium">Código Pix Copia e Cola</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrCode}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Tempo Restante */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tempo restante</p>
                <p className="text-2xl font-bold text-primary">{timeRemaining}</p>
              </div>

              {/* Status de verificação */}
              {checking && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Verificando pagamento...
                </p>
              )}
            </>
          )}

          {(status === 'approved' || status === 'rejected' || status === 'expired') && (
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
