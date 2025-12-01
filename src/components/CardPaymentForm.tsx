import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { useMercadoPago } from "@/hooks/useMercadoPago";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const { mp, deviceId, isLoading: mpLoading } = useMercadoPago();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const [cardholderEmail, setCardholderEmail] = useState("");
  const [cpf, setCpf] = useState("");
  
  const cardNumberRef = useRef<HTMLDivElement>(null);
  const expirationDateRef = useRef<HTMLDivElement>(null);
  const securityCodeRef = useRef<HTMLDivElement>(null);
  
  const [cardFormInstance, setCardFormInstance] = useState<any>(null);

  // Inicializar Secure Fields quando o MP SDK estiver pronto
  useEffect(() => {
    if (!mp || !cardNumberRef.current || cardFormInstance) return;

    console.log('Inicializando Secure Fields...');

    try {
      // Criar instância do CardForm com Secure Fields
      const cardForm = mp.cardForm({
        amount: String(valor),
        iframe: true,
        form: {
          id: "card-payment-form",
          cardNumber: {
            id: "card-number",
            placeholder: "Número do cartão",
          },
          expirationDate: {
            id: "expiration-date",
            placeholder: "MM/AA",
          },
          securityCode: {
            id: "security-code",
            placeholder: "CVV",
          },
          cardholderName: {
            id: "cardholder-name",
            placeholder: "Nome (como está no cartão)",
          },
          issuer: {
            id: "issuer",
            placeholder: "Banco emissor",
          },
          installments: {
            id: "installments",
            placeholder: "Parcelas",
          },
          identificationType: {
            id: "identification-type",
            placeholder: "Tipo de documento",
          },
          identificationNumber: {
            id: "identification-number",
            placeholder: "Número do documento",
          },
          cardholderEmail: {
            id: "cardholder-email",
            placeholder: "E-mail",
          },
        },
        callbacks: {
          onFormMounted: (error: any) => {
            if (error) {
              console.error('Erro ao montar formulário:', error);
              setError('Erro ao carregar formulário de pagamento');
            } else {
              console.log('Formulário montado com sucesso');
            }
          },
          onSubmit: async (event: any) => {
            event.preventDefault();
            handleSubmit();
          },
          onFetching: (resource: any) => {
            console.log('Fetching resource:', resource);
          },
        },
      });

      setCardFormInstance(cardForm);
    } catch (err) {
      console.error('Erro ao inicializar CardForm:', err);
      setError('Erro ao inicializar formulário de pagamento');
    }
  }, [mp, valor, cardFormInstance]);

  const handleSubmit = async () => {
    if (!cardFormInstance) {
      setError('Formulário não inicializado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obter token do cartão usando Secure Fields
      const cardData = await cardFormInstance.getCardFormData();
      
      if (!cardData.token) {
        throw new Error('Não foi possível gerar token do cartão');
      }

      console.log('Token do cartão gerado:', cardData.token);

      // Enviar para a edge function processar o pagamento
      const { data, error: functionError } = await supabase.functions.invoke(
        'process-card-payment',
        {
          body: {
            token: cardData.token,
            payment_method_id: cardData.paymentMethodId,
            issuer_id: cardData.issuerId,
            installments: cardData.installments,
            valor,
            artista_id: artistaId,
            cliente_id: clienteId,
            cliente_nome: clienteNome,
            session_id: sessionId,
            pedido_musica: pedidoMusica,
            pedido_mensagem: pedidoMensagem,
            device_id: deviceId,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Erro ao processar pagamento');
      }

      console.log('Pagamento processado:', data);

      if (data.status === 'approved') {
        toast({
          title: "Pagamento Aprovado!",
          description: "Sua gorjeta foi enviada com sucesso.",
        });
        onSuccess(data.payment_id);
      } else if (data.status === 'rejected') {
        throw new Error(data.status_detail || 'Pagamento recusado');
      } else {
        toast({
          title: "Processando Pagamento",
          description: "Seu pagamento está sendo processado.",
        });
        onSuccess(data.payment_id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
      console.error('Erro no pagamento:', errorMessage);
      setError(errorMessage);
      onError(errorMessage);
      toast({
        title: "Erro no Pagamento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (mpLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando formulário...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form id="card-payment-form" className="space-y-2">
        {/* Secure Fields - renderizados automaticamente pelo SDK */}
        <div className="space-y-1">
          <Label htmlFor="card-number">Número do Cartão</Label>
          <div 
            id="card-number" 
            ref={cardNumberRef}
            className="min-h-[36px] border rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="expiration-date">Validade</Label>
            <div 
              id="expiration-date" 
              ref={expirationDateRef}
              className="min-h-[36px] border rounded-md"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="security-code">CVV</Label>
            <div 
              id="security-code" 
              ref={securityCodeRef}
              className="min-h-[36px] border rounded-md"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="cardholder-name">Nome do Titular</Label>
          <input
            type="text"
            id="cardholder-name"
            className="w-full h-9 px-3 py-1.5 text-sm border rounded-md"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cardholder-email">E-mail</Label>
          <input
            type="email"
            id="cardholder-email"
            className="w-full h-9 px-3 py-1.5 text-sm border rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="identification-type">Tipo de Documento</Label>
            <select
              id="identification-type"
              className="w-full h-9 px-3 py-1.5 text-sm border rounded-md"
            >
              <option value="">Selecione</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="identification-number">CPF</Label>
            <input
              type="text"
              id="identification-number"
              className="w-full h-9 px-3 py-1.5 text-sm border rounded-md"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="issuer">Banco Emissor</Label>
          <select
            id="issuer"
            className="w-full h-9 px-3 py-1.5 text-sm border rounded-md"
          >
            <option value="">Carregando...</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="installments">Parcelas</Label>
          <select
            id="installments"
            className="w-full h-9 px-3 py-1.5 text-sm border rounded-md"
          >
            <option value="">Carregando...</option>
          </select>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !cardFormInstance}
        >
          {loading ? (
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
      </form>
    </div>
  );
};
