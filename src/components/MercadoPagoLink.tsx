import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ExternalLink, AlertCircle, TestTube, Info } from "lucide-react";

interface MercadoPagoLinkProps {
  userId: string;
}

export function MercadoPagoLink({ userId }: MercadoPagoLinkProps) {
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
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

  const handleTestMode = () => {
    setTestMode(!testMode);
    toast({
      title: testMode ? "Modo Teste Desativado" : "Modo Teste Ativado",
      description: testMode 
        ? "Voltou para o modo de produção" 
        : "Agora você pode simular splits de pagamento sem conexão real",
    });
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Receber Split de Pagamentos</CardTitle>
            <CardDescription>
              Vincule sua conta do Mercado Pago para receber 90% das gorjetas automaticamente
            </CardDescription>
          </div>
          {testMode && (
            <Badge variant="outline" className="gap-1">
              <TestTube className="h-3 w-3" />
              Modo Teste
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✅ Conta do Mercado Pago vinculada! Você receberá 90% do valor das gorjetas automaticamente.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Status Alert */}
            <Alert variant={testMode ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {testMode ? (
                  <>
                    <strong>Modo de Teste Ativo:</strong> Simule o fluxo de split sem conectar ao Mercado Pago.
                    Os pagamentos reais ainda vão para a plataforma.
                  </>
                ) : (
                  <>
                    <strong>Não Vinculado:</strong> Os pagamentos vão para a plataforma.
                    Você precisa solicitar transferências manualmente.
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Split Info */}
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Divisão de Valores</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você recebe:</span>
                  <span className="font-bold text-primary">90%</span>
                </div>
                <Progress value={90} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa da plataforma:</span>
                  <span className="font-medium">10%</span>
                </div>
              </div>
            </div>

            {/* Benefícios */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Benefícios do Split:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Receba 90% direto na sua conta</li>
                <li>Dinheiro disponível imediatamente após aprovação</li>
                <li>Sem necessidade de solicitar saques</li>
                <li>Acompanhe todos os pagamentos em tempo real</li>
              </ul>
            </div>

            {/* Ações */}
            <div className="space-y-2 pt-2">
              <Button 
                onClick={handleLink}
                className="w-full"
                disabled={testMode}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Vincular Conta do Mercado Pago
              </Button>
              
              <Button 
                onClick={handleTestMode}
                variant="outline"
                className="w-full"
              >
                <TestTube className="mr-2 h-4 w-4" />
                {testMode ? "Desativar" : "Ativar"} Modo de Teste
              </Button>
            </div>

            {/* Instruções para Produção */}
            {!testMode && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs space-y-1">
                  <p className="font-semibold">Para ativar o Split em Produção:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Acesse o painel de desenvolvedor do Mercado Pago</li>
                    <li>Configure a Redirect URI: <code className="text-xs bg-muted px-1 py-0.5 rounded">https://tnhbijlskoffgoocftfq.supabase.co/functions/v1/mercadopago-oauth-callback</code></li>
                    <li>Faça pagamentos de teste para aumentar a pontuação (73+ pontos)</li>
                    <li>Ative a aplicação no modo produção</li>
                  </ol>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
