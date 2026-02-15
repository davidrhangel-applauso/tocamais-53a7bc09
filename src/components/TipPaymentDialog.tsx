import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2, CreditCard } from "lucide-react";
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
  sessionId,
  pedidoMusica,
  pedidoMensagem,
}: TipPaymentDialogProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const origin = window.location.origin;
      
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          valor,
          artista_id: artistaId,
          cliente_id: clienteId,
          cliente_nome: clienteNome,
          session_id: sessionId,
          pedido_musica: pedidoMusica,
          pedido_mensagem: pedidoMensagem,
          success_url: `${origin}/artista/${artistaId}?payment=success`,
          cancel_url: `${origin}/artista/${artistaId}?payment=cancelled`,
        },
      });

      if (error) throw error;

      if (data?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error('URL de pagamento não gerada');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
          <DialogDescription>
            Você será redirecionado para uma página segura de pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/30 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor da gorjeta</p>
            <p className="text-3xl font-bold text-primary">
              R$ {valor.toFixed(2)}
            </p>
          </div>

          {pedidoMusica && (
            <div className="bg-muted/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Pedido musical</p>
              <p className="text-sm font-medium">{pedidoMusica}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Aceitamos cartão de crédito, débito e outros métodos
            </p>
          </div>

          <Button
            onClick={handlePayment}
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar R$ {valor.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
