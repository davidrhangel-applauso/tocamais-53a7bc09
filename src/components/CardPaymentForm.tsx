import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, CreditCard, AlertCircle, Calendar, Lock, User, Mail, FileText } from "lucide-react";
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
  
  const cardNumberRef = useRef<HTMLDivElement>(null);
  const expirationDateRef = useRef<HTMLDivElement>(null);
  const securityCodeRef = useRef<HTMLDivElement>(null);
  const cardFormRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  
  const [cardFormInstance, setCardFormInstance] = useState<any>(null);

  // Inicializar Secure Fields quando o MP SDK estiver pronto
  useEffect(() => {
    if (!mp || !cardNumberRef.current) return;
    
    // Evitar múltiplas inicializações
    if (isInitializedRef.current) return;

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
            placeholder: "0000 0000 0000 0000",
          },
          expirationDate: {
            id: "expiration-date",
            placeholder: "MM/AA",
          },
          securityCode: {
            id: "security-code",
            placeholder: "123",
          },
          cardholderName: {
            id: "cardholder-name",
            placeholder: "Nome completo",
          },
          issuer: {
            id: "issuer",
            placeholder: "Selecione o banco",
          },
          installments: {
            id: "installments",
            placeholder: "Escolha as parcelas",
          },
          identificationType: {
            id: "identification-type",
            placeholder: "Tipo",
          },
          identificationNumber: {
            id: "identification-number",
            placeholder: "000.000.000-00",
          },
          cardholderEmail: {
            id: "cardholder-email",
            placeholder: "seu@email.com",
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

      cardFormRef.current = cardForm;
      setCardFormInstance(cardForm);
      isInitializedRef.current = true;
    } catch (err) {
      console.error('Erro ao inicializar CardForm:', err);
      setError('Erro ao inicializar formulário de pagamento');
    }

    // Cleanup quando o componente desmontar
    return () => {
      if (cardFormRef.current && typeof cardFormRef.current.unmount === 'function') {
        try {
          cardFormRef.current.unmount();
          console.log('CardForm desmontado');
        } catch (err) {
          console.error('Erro ao desmontar CardForm:', err);
        }
      }
      isInitializedRef.current = false;
    };
  }, [mp, valor]);

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Carregando formulário de pagamento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form id="card-payment-form" className="space-y-6">
        {/* Seção: Dados do Cartão */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Dados do Cartão</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-number" className="text-sm font-medium">
              Número do Cartão *
            </Label>
            <div 
              id="card-number" 
              ref={cardNumberRef}
              className="min-h-[44px] w-full border border-input bg-background rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiration-date" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Validade *
              </Label>
              <div 
                id="expiration-date" 
                ref={expirationDateRef}
                className="min-h-[44px] w-full border border-input bg-background rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="security-code" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-3 h-3" />
                CVV *
              </Label>
              <div 
                id="security-code" 
                ref={securityCodeRef}
                className="min-h-[44px] w-full border border-input bg-background rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Seção: Dados do Titular */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <User className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Dados do Titular</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardholder-name" className="text-sm font-medium">
              Nome Completo (como está no cartão) *
            </Label>
            <div className="min-h-[44px] w-full border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
              <input
                type="text"
                id="cardholder-name"
                className="w-full h-full px-3 py-2 bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardholder-email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-3 h-3" />
              E-mail *
            </Label>
            <div className="min-h-[44px] w-full border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
              <input
                type="email"
                id="cardholder-email"
                className="w-full h-full px-3 py-2 bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="identification-type" className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Tipo de Documento *
              </Label>
              <div className="min-h-[44px] w-full border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
                <select
                  id="identification-type"
                  className="w-full h-full px-3 py-2 bg-transparent outline-none text-sm appearance-none cursor-pointer"
                >
                  <option value="">Selecione</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identification-number" className="text-sm font-medium">
                Número do Documento *
              </Label>
              <div className="min-h-[44px] w-full border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
                <input
                  type="text"
                  id="identification-number"
                  className="w-full h-full px-3 py-2 bg-transparent outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção: Opções de Pagamento */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Opções de Pagamento</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuer" className="text-sm font-medium">
              Banco Emissor *
            </Label>
            <div className="min-h-[44px] w-full border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
              <select
                id="issuer"
                className="w-full h-full px-3 py-2 bg-transparent outline-none text-sm appearance-none cursor-pointer"
              >
                <option value="">Carregando opções...</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="installments" className="text-sm font-medium">
              Número de Parcelas *
            </Label>
            <div className="min-h-[44px] w-full border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
              <select
                id="installments"
                className="w-full h-full px-3 py-2 bg-transparent outline-none text-sm appearance-none cursor-pointer"
              >
                <option value="">Carregando parcelas...</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={loading || !cardFormInstance}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando pagamento...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pagar R$ {valor.toFixed(2)}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            * Campos obrigatórios
          </p>
        </div>
      </form>
    </div>
  );
};