import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CardPaymentRequest {
  token: string;
  payment_method_id: string;
  issuer_id: string;
  installments: number | string;
  valor: number;
  artista_id: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  session_id?: string;
  pedido_musica?: string | null;
  pedido_mensagem?: string | null;
  device_id?: string | null;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

// Função auxiliar para obter token válido do artista (com refresh se necessário)
async function getValidSellerToken(
  artista: any,
  supabase: any
): Promise<string | null> {
  if (!artista.mercadopago_access_token) {
    return null;
  }

  // Verificar se token ainda é válido (com margem de 5 minutos)
  const expiresAt = new Date(artista.mercadopago_token_expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt > fiveMinutesFromNow) {
    console.log('Token do artista ainda válido até:', expiresAt.toISOString());
    return artista.mercadopago_access_token;
  }

  // Token expirado ou prestes a expirar - fazer refresh
  console.log('Token expirado, fazendo refresh...');

  const clientId = Deno.env.get('MERCADO_PAGO_CLIENT_ID');
  const clientSecret = Deno.env.get('MERCADO_PAGO_CLIENT_SECRET');

  if (!clientId || !clientSecret || !artista.mercadopago_refresh_token) {
    console.error('Não é possível fazer refresh: credenciais ou refresh_token ausentes');
    return null;
  }

  try {
    const refreshResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: artista.mercadopago_refresh_token,
      }).toString(),
    });

    const refreshData = await refreshResponse.json();

    if (!refreshResponse.ok || !refreshData.access_token) {
      console.error('Erro ao fazer refresh do token:', refreshData);
      return null;
    }

    // Calcular nova data de expiração
    const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();

    // Atualizar tokens no banco
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        mercadopago_access_token: refreshData.access_token,
        mercadopago_refresh_token: refreshData.refresh_token,
        mercadopago_token_expires_at: newExpiresAt,
      })
      .eq('id', artista.id);

    if (updateError) {
      console.error('Erro ao atualizar tokens no banco:', updateError);
    } else {
      console.log('Tokens atualizados com sucesso! Novo token expira em:', newExpiresAt);
    }

    return refreshData.access_token;
  } catch (error) {
    console.error('Erro no refresh de token:', error);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      token,
      payment_method_id,
      issuer_id,
      installments,
      valor,
      artista_id,
      cliente_id,
      cliente_nome,
      session_id,
      pedido_musica,
      pedido_mensagem,
      device_id,
      payer,
    }: CardPaymentRequest = await req.json();

    console.log('Processing card payment:', { payment_method_id, valor, artista_id });

    // Validações
    if (!token || !payment_method_id || !valor || !artista_id) {
      throw new Error('Dados obrigatórios ausentes');
    }

    if (!payer || !payer.email || !payer.identification || !payer.identification.type || !payer.identification.number) {
      throw new Error('Informações do pagador são obrigatórias');
    }

    if (!cliente_id && !session_id) {
      throw new Error('É necessário fornecer cliente_id ou session_id');
    }

    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar informações do artista incluindo tokens OAuth
    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('nome, id, mercadopago_seller_id, mercadopago_access_token, mercadopago_refresh_token, mercadopago_token_expires_at, tipo, plano')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista || artista.tipo !== 'artista') {
      throw new Error('Artista não encontrado');
    }

    // Token da plataforma (fallback)
    const platformToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!platformToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Verificar se artista é Pro (tem assinatura ativa)
    const { data: activeSubscription } = await supabase
      .from('artist_subscriptions')
      .select('id')
      .eq('artista_id', artista_id)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())
      .single();

    const isPro = artista.plano === 'pro' && !!activeSubscription;
    const taxaPercentual = isPro ? 0 : 0.20; // Pro: 0%, Free: 20%

    console.log('Artist plan:', { plano: artista.plano, isPro, taxaPercentual });

    // Calcular valores
    const valorBruto = valor;
    const taxaPlataforma = Number((valorBruto * taxaPercentual).toFixed(2));
    const valorLiquidoArtista = Number((valorBruto * (1 - taxaPercentual)).toFixed(2));
    const taxaProcessamento = Number((valorBruto * 0.01).toFixed(2));
    const valorTotal = Number((valorBruto + taxaProcessamento).toFixed(2));

    // Garantir que installments seja numérico
    const installmentsNumber =
      typeof installments === 'string' ? parseInt(installments, 10) : installments;

    if (!installmentsNumber || isNaN(installmentsNumber)) {
      throw new Error('Número de parcelas inválido');
    }

    // Gerar UUID da gorjeta
    const gorjetaId = crypto.randomUUID();

    // Verificar se artista tem token OAuth válido para split payment
    const sellerToken = await getValidSellerToken(artista, supabase);
    const useSellerToken = sellerToken && artista.mercadopago_seller_id;

    // Token a ser usado na requisição
    const tokenToUse = useSellerToken ? sellerToken : platformToken;

    // Preparar dados do pagamento
    const paymentData: any = {
      transaction_amount: valorTotal,
      token,
      description: `Gorjeta para ${artista.nome}`,
      installments: installmentsNumber,
      payment_method_id,
      issuer_id,
      payer: {
        email: payer.email,
        identification: {
          type: payer.identification.type,
          number: payer.identification.number,
        },
      },
      external_reference: gorjetaId,
      statement_descriptor: 'GORJETA ARTISTA',
      additional_info: {
        items: [
          {
            id: gorjetaId,
            title: `Gorjeta para ${artista.nome}`,
            description: pedido_musica 
              ? `Gorjeta com pedido musical: ${pedido_musica}` 
              : `Gorjeta para o artista ${artista.nome}`,
            quantity: 1,
            unit_price: valorTotal,
            category_id: 'entertainment',
          }
        ],
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

    // Adicionar device_id se fornecido
    if (device_id) {
      paymentData.metadata = { device_id };
    }

    // Configurar split payment corretamente
    if (useSellerToken && taxaPlataforma > 0) {
      // Usando token do artista: application_fee é a comissão da plataforma
      paymentData.application_fee = taxaPlataforma;
      console.log('Split payment com token do artista:', {
        application_fee: taxaPlataforma,
        valor_total: valorTotal,
        valor_artista_recebe: valorLiquidoArtista,
        valor_plataforma_recebe: taxaPlataforma,
      });
    } else if (useSellerToken) {
      // Artista Pro com token: 100% vai para o artista
      console.log('Artista Pro - 100% do pagamento vai para o artista');
    } else {
      // Sem token: pagamento vai para a plataforma
      console.log('Artista sem token OAuth - pagamento vai para plataforma');
    }

    console.log('Criando pagamento com cartão...');
    console.log('Usando token:', useSellerToken ? 'do artista' : 'da plataforma');

    // Gerar chave de idempotência
    const idempotencyKey = crypto.randomUUID();

    // Criar pagamento usando API REST diretamente
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenToUse}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MP API error:', response.status, errorText);
      throw new Error(`Erro ao criar pagamento: ${response.status} - ${errorText}`);
    }

    const mpData = await response.json();
    console.log('Pagamento criado:', mpData.id, 'Status:', mpData.status);

    // Salvar gorjeta no banco
    const { data: gorjeta, error: gorjetaError } = await supabase
      .from('gorjetas')
      .insert({
        id: gorjetaId,
        valor: valorBruto,
        valor_liquido_artista: valorLiquidoArtista,
        taxa_plataforma: taxaPlataforma,
        artista_id,
        cliente_id: cliente_id || null,
        cliente_nome: cliente_nome || null,
        session_id: session_id || null,
        payment_id: mpData.id!.toString(),
        status_pagamento: mpData.status || 'pending',
        qr_code: null,
        qr_code_base64: null,
        expires_at: null,
        pedido_musica: pedido_musica || null,
        pedido_mensagem: pedido_mensagem || null,
      })
      .select()
      .single();

    if (gorjetaError) {
      console.error('Error inserting gorjeta:', gorjetaError);
      throw new Error('Erro ao salvar gorjeta no banco');
    }

    console.log('Gorjeta salva:', gorjeta.id);

    return new Response(
      JSON.stringify({
        id: gorjeta.id,
        payment_id: mpData.id,
        status: mpData.status,
        status_detail: mpData.status_detail,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in process-card-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
