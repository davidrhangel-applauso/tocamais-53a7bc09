import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ExternalLink, AlertCircle, Info, RefreshCw } from "lucide-react";
import { MERCADO_PAGO_CONFIG } from "@/config/mercadopago";

interface MercadoPagoLinkProps {
  userId: string;
  isPro?: boolean;
  hasAccessToken?: boolean;
}

export function MercadoPagoLink({ userId, isPro = false, hasAccessToken = false }: MercadoPagoLinkProps) {
  const [isLinked, setIsLinked] = useState(false);
  const [needsRelink, setNeedsRelink] = useState(false);
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
      // Buscar credenciais da nova tabela segura
      const { data, error } = await supabase
        .from('artist_mercadopago_credentials')
        .select('seller_id, access_token')
        .eq('artist_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      const hasSellerId = !!data?.seller_id;
      const hasToken = !!data?.access_token;
      
      // Tem seller_id mas não tem access_token = precisa revincular
      setNeedsRelink(hasSellerId && !hasToken);
      // Totalmente vinculado = tem ambos
      setIsLinked(hasSellerId && hasToken);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = () => {
    // Verificar se CLIENT_ID está configurado
    const clientId = MERCADO_PAGO_CONFIG.clientId;
    
    if (!clientId || clientId === "YOUR_CLIENT_ID_HERE") {
      toast({
        title: "Configuração Pendente",
        description: "O Client ID do Mercado Pago ainda não foi configurado. Entre em contato com o suporte.",
        variant: "destructive",
      });
      return;
    }
    
    // URL de autorização do Mercado Pago
    const redirectUri = MERCADO_PAGO_CONFIG.redirectUri;
    
    const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${userId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    console.log('Redirecionando para OAuth do Mercado Pago:', authUrl);
    
    // Redirecionar para OAuth
    window.location.href = authUrl;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle>Receber Pagamentos via Mercado Pago</CardTitle>
          <CardDescription>
            {isPro 
              ? "Vincule sua conta para receber 100% das gorjetas automaticamente (Plano Pro)"
              : "Vincule sua conta para receber 80% das gorjetas automaticamente (Plano Free - 20% taxa)"
            }
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✅ Conta do Mercado Pago vinculada! Você receberá {isPro ? "100%" : "80%"} do valor das gorjetas automaticamente.
              {!isPro && " Assine o Plano Pro para receber 100%!"}
            </AlertDescription>
          </Alert>
        ) : needsRelink ? (
          <>
            {/* Alerta de Revinculação Necessária */}
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200 space-y-2">
                <p className="font-semibold">⚠️ Ação Necessária: Revincule sua conta</p>
                <p className="text-sm">
                  Sua conta do Mercado Pago foi vinculada antes de uma atualização importante. 
                  Para ativar pagamentos automáticos, você precisa revincular sua conta.
                </p>
                <p className="text-sm font-medium">
                  Atualmente, os pagamentos estão sendo processados pela plataforma e precisam ser transferidos manualmente.
                </p>
              </AlertDescription>
            </Alert>

            {/* Split Info */}
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Após revincular ({isPro ? "Pro" : "Free"})</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você receberá:</span>
                  <span className="font-bold text-primary">{isPro ? "100%" : "80%"}</span>
                </div>
                <Progress value={isPro ? 100 : 80} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa da plataforma:</span>
                  <span className="font-medium">{isPro ? "0%" : "20%"}</span>
                </div>
              </div>
            </div>

            {/* Botão de Revincular */}
            <div className="pt-2">
              <Button 
                onClick={handleLink}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Revincular Conta do Mercado Pago
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Status Alert */}
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Não Vinculado:</strong> Os pagamentos vão para a plataforma.
                Você precisa solicitar transferências manualmente.
              </AlertDescription>
            </Alert>

            {/* Split Info */}
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Divisão de Valores {isPro ? "(Pro)" : "(Free)"}</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você recebe:</span>
                  <span className="font-bold text-primary">{isPro ? "100%" : "80%"}</span>
                </div>
                <Progress value={isPro ? 100 : 80} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa da plataforma:</span>
                  <span className="font-medium">{isPro ? "0%" : "20%"}</span>
                </div>
              </div>
            </div>

            {/* Benefícios */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Benefícios:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Receba {isPro ? "100%" : "80%"} direto na sua conta</li>
                <li>Dinheiro disponível imediatamente após aprovação</li>
                <li>Sem necessidade de solicitar saques</li>
                <li>Acompanhe todos os pagamentos em tempo real</li>
                {!isPro && <li className="text-primary font-medium">Assine o Pro para receber 100%!</li>}
              </ul>
            </div>

            {/* Ação */}
            <div className="pt-2">
              <Button 
                onClick={handleLink}
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Vincular Conta do Mercado Pago
              </Button>
            </div>

            {/* Instruções */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs space-y-2">
                <p className="font-semibold text-sm">📋 Checklist para Ativar Split:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <strong>Criar Aplicação no Mercado Pago</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>Acesse: <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Painel de Desenvolvedores</a></li>
                      <li>Crie uma nova aplicação de tipo "Online payments"</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Configurar Redirect URI</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>Nas configurações da aplicação, adicione:</li>
                      <li><code className="text-xs bg-muted px-1 py-0.5 rounded block mt-1">https://tnhbijlskoffgoocftfq.supabase.co/functions/v1/mercadopago-oauth-callback</code></li>
                    </ul>
                  </li>
                  <li>
                    <strong>Ativar Modo Produção</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>Fazer pelo menos 5 pagamentos de teste</li>
                      <li>Atingir 73+ pontos de qualidade</li>
                      <li>Solicitar ativação em produção</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Informar Client ID e Secret</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>Copie o Client ID e Client Secret da sua aplicação</li>
                      <li>Entre em contato para configurar na plataforma</li>
                    </ul>
                  </li>
                </ol>
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    ⚠️ Importante: O split só funciona em modo produção.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
