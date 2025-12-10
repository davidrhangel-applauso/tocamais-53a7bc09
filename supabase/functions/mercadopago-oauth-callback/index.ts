import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Obter URL do app das variáveis de ambiente ou usar fallback
  const appUrl = Deno.env.get('APP_URL') || 'https://id-preview--be6d7b14-8d70-4f34-91f4-6a3fe00db815.lovable.app';

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // artist_id
    const error = url.searchParams.get('error');

    console.log('OAuth callback recebido:', { code: code ? 'presente' : 'ausente', state, error });

    // Erro do Mercado Pago
    if (error) {
      console.error('Erro no OAuth do MP:', error);
      return redirectWithError(appUrl, 'auth_error', 'Autorização negada pelo Mercado Pago');
    }

    if (!code || !state) {
      console.error('Parâmetros ausentes:', { code: !!code, state: !!state });
      return redirectWithError(appUrl, 'missing_params', 'Parâmetros obrigatórios ausentes');
    }

    // Configurar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se artista já está vinculado (proteção contra refresh)
    const { data: existingCredentials } = await supabase
      .from('artist_mercadopago_credentials')
      .select('seller_id, access_token')
      .eq('artist_id', state)
      .maybeSingle();

    if (existingCredentials?.access_token) {
      console.log('Artista já possui conta vinculada com token, redirecionando...');
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${appUrl}/painel?mp_linked=true` },
      });
    }

    // Trocar código por token usando HTTP fetch direto
    const clientId = Deno.env.get('MERCADO_PAGO_CLIENT_ID');
    const clientSecret = Deno.env.get('MERCADO_PAGO_CLIENT_SECRET');
    const redirectUri = `${supabaseUrl}/functions/v1/mercadopago-oauth-callback`;

    if (!clientId || !clientSecret) {
      console.error('Credenciais do MP não configuradas');
      return redirectWithError(appUrl, 'config_error', 'Configuração do servidor incompleta');
    }

    console.log('Trocando código por token via HTTP fetch...');

    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Erro ao trocar código por token:', tokenData);
      const errorMsg = tokenData.error === 'invalid_grant' 
        ? 'Código expirado. Por favor, tente vincular novamente.'
        : 'Erro ao autorizar com Mercado Pago';
      return redirectWithError(appUrl, 'token_error', errorMsg);
    }

    console.log('Token obtido com sucesso. expires_in:', tokenData.expires_in);

    // Buscar informações do vendedor
    const userResponse = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Erro ao buscar dados do vendedor');
      return redirectWithError(appUrl, 'user_error', 'Erro ao obter dados da conta');
    }

    const userInfo = await userResponse.json();
    const sellerId = userInfo.id.toString();
    console.log('Seller ID obtido:', sellerId);

    // Calcular data de expiração do token
    const tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Salvar credenciais na tabela segura (upsert para atualizar se já existir)
    const { error: upsertError } = await supabase
      .from('artist_mercadopago_credentials')
      .upsert({ 
        artist_id: state,
        seller_id: sellerId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'artist_id'
      });

    if (upsertError) {
      console.error('Erro ao salvar credenciais:', upsertError);
      return redirectWithError(appUrl, 'db_error', 'Erro ao salvar vinculação');
    }

    console.log('Conta vinculada com sucesso! Token expira em:', tokenExpiresAt);

    return new Response(null, {
      status: 302,
      headers: { 'Location': `${appUrl}/painel?mp_linked=true` },
    });

  } catch (error) {
    console.error('Erro inesperado no callback:', error);
    return redirectWithError(appUrl, 'server_error', 'Erro interno do servidor');
  }
});

function redirectWithError(origin: string, code: string, message: string): Response {
  const params = new URLSearchParams({ mp_error: code, mp_message: message });
  return new Response(null, {
    status: 302,
    headers: { 'Location': `${origin}/painel?${params.toString()}` },
  });
}
