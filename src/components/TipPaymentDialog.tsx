import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { CreditCard, Smartphone, Loader2 } from "lucide-react";
import { CardPaymentForm } from "./CardPaymentForm";
import { PixPaymentDialog } from "./PixPaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TipPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valor: number;
  artistaId: string;
  clienteId?: string | null;
  clienteNome?: string | null;
  clienteCpf?: string | null;
  sessionId?: string;
  pedidoMusica?: string | null;
  pedidoMensagem?: string | null;
}

export const TipPaymentDialog = ({
  open,
  onOpenChange,
  valor,
  artistaId,
  clienteId,
  clienteNome,
  clienteCpf,
  sessionId,
  pedidoMusica,
  pedidoMensagem,
}: TipPaymentDialogProps) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [processing, setProcessing] = useState(false);
  
  // Estados para Pix
  const [pixPaymentData, setPixPaymentData] = useState<{
    gorjetaId: string;
    qrCode: string;
    qrCodeBase64: string;
    expiresAt: string;
  } | null>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);

  const handleCreatePixPayment = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          valor,
          artista_id: artistaId,
          cliente_id: clienteId,
          cliente_nome: clienteNome,
          cliente_cpf: clienteCpf,
          session_id: sessionId,
          pedido_musica: pedidoMusica,
          pedido_mensagem: pedidoMensagem,
        },
      });

      if (error) throw error;

      setPixPaymentData({
        gorjetaId: data.id,
        qrCode: data.qr_code,
        qrCodeBase64: data.qr_code_base64,
        expiresAt: data.expires_at,
      });
      
      setPixDialogOpen(true);
      onOpenChange(false); // Fechar o diálogo de método de pagamento
    } catch (error) {
      console.error('Error creating Pix payment:', error);
      toast({
        title: "Erro ao gerar Pix",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPaymentSuccess = (paymentId: string) => {
    toast({
      title: "Pagamento Aprovado!",
      description: "Sua gorjeta foi enviada com sucesso.",
    });
    onOpenChange(false);
  };

  const handleCardPaymentError = (error: string) => {
    toast({
      title: "Erro no Pagamento",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Escolha a forma de pagamento</DialogTitle>
            <DialogDescription>
              Valor da gorjeta: R$ {valor.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'pix' | 'card')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pix" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Pix
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Cartão
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pix" className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Pagamento instantâneo via Pix
                </p>
                <Button 
                  onClick={handleCreatePixPayment}
                  disabled={processing}
                  className="w-full"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Gerar QR Code Pix
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="card">
              <CardPaymentForm
                valor={valor}
                artistaId={artistaId}
                clienteId={clienteId}
                clienteNome={clienteNome}
                sessionId={sessionId}
                pedidoMusica={pedidoMusica}
                pedidoMensagem={pedidoMensagem}
                onSuccess={handleCardPaymentSuccess}
                onError={handleCardPaymentError}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Pix Payment Dialog */}
      {pixPaymentData && (
        <PixPaymentDialog
          open={pixDialogOpen}
          onOpenChange={setPixDialogOpen}
          gorjetaId={pixPaymentData.gorjetaId}
          qrCode={pixPaymentData.qrCode}
          qrCodeBase64={pixPaymentData.qrCodeBase64}
          expiresAt={pixPaymentData.expiresAt}
        />
      )}
    </>
  );
};
