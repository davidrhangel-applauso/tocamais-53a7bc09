import { useState, useEffect } from 'react';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { MERCADO_PAGO_CONFIG } from '@/config/mercadopago';

interface CardPaymentFormProps {
  valor: number;
  artistaId: string;
  clienteId?: string | null;
  clienteNome?: string | null;
  sessionId?: string;
  pedidoMusica?: string | null;
  pedidoMensagem?: string | null;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export const CardPaymentForm = ({
  valor,
  artistaId,
  clienteId,
  clienteNome,
  sessionId,
  pedidoMusica,
  pedidoMensagem,
  onSuccess,
  onError,
}: CardPaymentFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Inicializar o SDK React do Mercado Pago
    console.log('Inicializando Mercado Pago SDK React...');
    initMercadoPago(MERCADO_PAGO_CONFIG.publicKey, {
      locale: 'pt-BR',
    });
    setIsMounted(true);
    console.log('Mercado Pago SDK React inicializado');
  }, []);

  const handleSubmit = async (formData: any) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('Processando pagamento com cartão:', formData);

    try {
      // Enviar para a edge function processar o pagamento
      const { data, error: functionError } = await supabase.functions.invoke(
        'process-card-payment',
        {
          body: {
            token: formData.token,
            payment_method_id: formData.payment_method_id,
            issuer_id: formData.issuer_id,
            installments: formData.installments,
            valor,
            artista_id: artistaId,
            cliente_id: clienteId,
            cliente_nome: clienteNome,
            session_id: sessionId,
            pedido_musica: pedidoMusica,
            pedido_mensagem: pedidoMensagem,
            payer: {
              email: formData.payer.email,
              identification: {
                type: formData.payer.identification.type,
                number: formData.payer.identification.number,
              },
            },
          },
        }
      );

      if (functionError) {
        console.error('Erro na edge function:', functionError);
        throw new Error(functionError.message || 'Erro ao processar pagamento');
      }

      console.log('Resposta da edge function:', data);

      if (data?.status === 'approved') {
        toast.success('Pagamento aprovado!');
        onSuccess(data.payment_id);
      } else if (data?.status === 'pending') {
        toast.info('Pagamento em processamento');
        onSuccess(data.payment_id);
      } else if (data?.status === 'rejected') {
        const statusDetail = data?.status_detail || 'desconhecido';
        toast.error(`Pagamento recusado: ${statusDetail}`);
        onError(`Pagamento recusado: ${statusDetail}`);
      } else {
        throw new Error('Status de pagamento desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      const errorMessage = error.message || 'Erro ao processar pagamento';
      toast.error(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = async (error: any) => {
    console.error('Erro no CardPayment Brick:', error);
    toast.error('Erro ao processar pagamento');
    onError(error?.message || 'Erro ao processar pagamento');
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Carregando formulário...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          Pagamento seguro processado pelo Mercado Pago
        </p>
        <p className="text-lg font-semibold">
          Total: R$ {valor.toFixed(2)}
        </p>
      </div>

      <CardPayment
        initialization={{
          amount: valor,
          payer: {
            email: '',
          },
        }}
        customization={{
          visual: {
            style: {
              theme: 'default',
            },
          },
          paymentMethods: {
            maxInstallments: 12,
          },
        }}
        onSubmit={handleSubmit}
        onError={handleError}
        onReady={() => console.log('CardPayment Brick pronto')}
      />
    </div>
  );
};
