import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // state contém o artist_id
    const error = url.searchParams.get('error');

    console.log('OAuth callback recebido:', { code, state, error });

    if (error) {
      console.error('Erro no OAuth:', error);
      return new Response(
        JSON.stringify({ error: 'Erro na autorização do Mercado Pago' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Código de autorização não fornecido' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Trocar o código por access token
    const clientId = Deno.env.get('MERCADO_PAGO_CLIENT_ID');
    const clientSecret = Deno.env.get('MERCADO_PAGO_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-oauth-callback`;

    console.log('Trocando código por token...');

    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Erro ao trocar código por token:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erro ao obter token do Mercado Pago' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('Token recebido com sucesso');

    // Buscar informações do vendedor
    const userInfoResponse = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.text();
      console.error('Erro ao buscar informações do usuário:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar dados do vendedor' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userInfo = await userInfoResponse.json();
    const sellerId = userInfo.id.toString();
    console.log('Seller ID:', sellerId);

    // Atualizar o perfil do artista no Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ mercadopago_seller_id: sellerId })
      .eq('id', state);

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar dados no perfil' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Perfil atualizado com sucesso');

    // Redirecionar de volta para o painel do artista
    const redirectUrl = `${url.origin}/painel?mp_linked=true`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('Erro no callback OAuth:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
