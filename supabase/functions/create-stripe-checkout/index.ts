import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
};

const ERROR_MESSAGES = {
  INVALID_VALUE: 'Valor inválido',
  INVALID_ARTIST: 'Artista não encontrado',
  MISSING_ID: 'Identificação necessária',
  PAYMENT_FAILED: 'Não foi possível processar o pagamento. Tente novamente.',
  INTERNAL_ERROR: 'Erro interno. Tente novamente mais tarde.',
};

interface CheckoutRequest {
  valor: number;
  artista_id: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  session_id?: string;
  pedido_musica?: string | null;
  pedido_mensagem?: string | null;
  success_url?: string;
  cancel_url?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      valor,
      artista_id,
      cliente_id,
      cliente_nome,
      session_id,
      pedido_musica,
      pedido_mensagem,
      success_url,
      cancel_url,
    }: CheckoutRequest = await req.json();

    console.log('Creating Stripe checkout for artist:', artista_id);

    // Validations
    if (!valor || valor < 1 || valor > 10000) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_VALUE }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!artista_id) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_ARTIST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(artista_id)) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_ARTIST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!cliente_id && !session_id) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.MISSING_ID }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify artist
    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('nome, id, tipo, plano')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista || artista.tipo !== 'artista') {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_ARTIST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check PRO status
    const { data: activeSubscription } = await supabase
      .from('artist_subscriptions')
      .select('id, ends_at')
      .eq('artista_id', artista_id)
      .eq('status', 'active')
      .maybeSingle();

    const isPro = artista.plano === 'pro' && (
      !activeSubscription ||
      activeSubscription.ends_at === null ||
      new Date(activeSubscription.ends_at) > new Date()
    );

    const taxaPercentual = isPro ? 0 : 0.20;
    const taxaPlataforma = Number((valor * taxaPercentual).toFixed(2));
    const valorLiquidoArtista = Number((valor * (1 - taxaPercentual)).toFixed(2));

    // Create gorjeta record
    const gorjetaId = crypto.randomUUID();

    const { error: gorjetaError } = await supabase
      .from('gorjetas')
      .insert({
        id: gorjetaId,
        valor,
        valor_liquido_artista: valorLiquidoArtista,
        taxa_plataforma: taxaPlataforma,
        artista_id,
        cliente_id: cliente_id || null,
        cliente_nome: cliente_nome || null,
        session_id: session_id || null,
        status_pagamento: 'pending',
        pedido_musica: pedido_musica || null,
        pedido_mensagem: pedido_mensagem || null,
      });

    if (gorjetaError) {
      console.error('[INTERNAL] Database error:', gorjetaError);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create Stripe Checkout session
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const amountInCents = Math.round(valor * 100);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Gorjeta para ${artista.nome}`,
              description: pedido_musica
                ? `Pedido musical: ${pedido_musica}`
                : `Gorjeta para o artista ${artista.nome}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        gorjeta_id: gorjetaId,
        artista_id,
        cliente_id: cliente_id || '',
        session_id: session_id || '',
        tipo: 'gorjeta',
      },
      success_url: success_url || `${Deno.env.get('APP_URL') || 'https://tocamais.lovable.app'}/artista/${artista_id}?payment=success&gorjeta_id=${gorjetaId}`,
      cancel_url: cancel_url || `${Deno.env.get('APP_URL') || 'https://tocamais.lovable.app'}/artista/${artista_id}?payment=cancelled`,
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    // Update gorjeta with Stripe session ID
    await supabase
      .from('gorjetas')
      .update({ payment_id: checkoutSession.id })
      .eq('id', gorjetaId);

    console.log('Stripe checkout created:', checkoutSession.id);

    return new Response(
      JSON.stringify({
        gorjeta_id: gorjetaId,
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('[INTERNAL] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
