import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";

interface MercadoPagoLinkProps {
  userId: string;
}

export function MercadoPagoLink({ userId }: MercadoPagoLinkProps) {
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkLinkStatus();
    
    // Verificar se voltou do OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mp_linked') === 'true') {
      toast({
        title: "Conta vinculada!",
        description: "Sua conta do Mercado Pago foi vinculada com sucesso.",
      });
      // Limpar parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname);
      checkLinkStatus();
    }
  }, []);

  const checkLinkStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('mercadopago_seller_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setIsLinked(!!data?.mercadopago_seller_id);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = () => {
    // URL de autorização do Mercado Pago
    const clientId = import.meta.env.VITE_MERCADO_PAGO_CLIENT_ID || '4085949071616879';
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadopago-oauth-callback`;
    
    const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${userId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    // Redirecionar para OAuth
    window.location.href = authUrl;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receber Split de Pagamentos</CardTitle>
        <CardDescription>
          Vincule sua conta do Mercado Pago para receber 90% do valor das gorjetas diretamente em sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Sua conta do Mercado Pago está vinculada. Você receberá automaticamente 90% do valor das gorjetas.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Atualmente, os pagamentos vão para a plataforma e você precisa solicitar transferências manualmente.
                Vincule sua conta do Mercado Pago para receber automaticamente.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Como funciona:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Você receberá 90% do valor de cada gorjeta</li>
                <li>10% fica com a plataforma (taxa administrativa)</li>
                <li>O dinheiro cai diretamente na sua conta do Mercado Pago</li>
                <li>Sem necessidade de solicitar saques</li>
              </ul>
            </div>

            <Button 
              onClick={handleLink}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Vincular Conta do Mercado Pago
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
