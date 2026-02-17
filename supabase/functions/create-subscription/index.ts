import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generic error messages for security
const ERROR_MESSAGES = {
  INVALID_ARTIST: 'Artista não encontrado',
  NOT_ARTIST: 'Apenas artistas podem assinar o plano Pro',
  ALREADY_SUBSCRIBED: 'Você já possui uma assinatura ativa',
  PAYMENT_FAILED: 'Não foi possível processar o pagamento. Tente novamente.',
  INTERNAL_ERROR: 'Erro interno. Tente novamente mais tarde.',
};

interface SubscriptionRequest {
  artista_id: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artista_id }: SubscriptionRequest = await req.json();

    console.log('Creating subscription for artist');

    if (!artista_id) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_ARTIST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(artista_id)) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_ARTIST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify artist exists
    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('id, nome, tipo')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_ARTIST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (artista.tipo !== 'artista') {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.NOT_ARTIST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check for existing active subscription
    const { data: existingSub } = await supabase
      .from('artist_subscriptions')
      .select('id, status, ends_at')
      .eq('artista_id', artista_id)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())
      .single();

    if (existingSub) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.ALREADY_SUBSCRIBED }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      console.error('[INTERNAL] MP token not configured');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.PAYMENT_FAILED }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const subscriptionId = crypto.randomUUID();
    const valorAssinatura = 39.90;

    const paymentData = {
      transaction_amount: valorAssinatura,
      description: 'Assinatura Pro - Gorjetas 100%',
      payment_method_id: 'pix',
      statement_descriptor: 'ASSINATURA PRO',
      external_reference: `sub_${subscriptionId}`,
      additional_info: {
        items: [
          {
            id: subscriptionId,
            title: 'Plano Pro - Mensalidade',
            description: 'Assinatura mensal do Plano Pro - Taxa 0% nas gorjetas',
            quantity: 1,
            unit_price: valorAssinatura,
            category_id: 'services',
          },
        ],
      },
      payer: {
        email: 'artista@example.com',
        first_name: artista.nome.split(' ')[0] || 'Artista',
        last_name: artista.nome.split(' ').slice(1).join(' ') || 'Pro',
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/subscription-webhook`,
    };

    const idempotencyKey = crypto.randomUUID();

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mercadoPagoToken}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    if (!mpResponse.ok) {
      console.error('[INTERNAL] MP API error:', mpResponse.status);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.PAYMENT_FAILED }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const mpData = await mpResponse.json();

    const { data: subscription, error: subError } = await supabase
      .from('artist_subscriptions')
      .insert({
        id: subscriptionId,
        artista_id,
        status: 'pending',
        starts_at: null,
        ends_at: null,
        payment_id: mpData.id.toString(),
        valor: valorAssinatura,
      })
      .select()
      .single();

    if (subError) {
      console.error('[INTERNAL] Database error:', subError);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Subscription created successfully');

    return new Response(
      JSON.stringify({
        id: subscription.id,
        payment_id: mpData.id,
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        valor: valorAssinatura,
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
