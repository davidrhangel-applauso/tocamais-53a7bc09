import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Creating subscription for artist:', artista_id);

    if (!artista_id) {
      throw new Error('ID do artista é obrigatório');
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(artista_id)) {
      throw new Error('ID do artista inválido');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verificar se artista existe e é do tipo artista
    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('id, nome, tipo, mercadopago_seller_id')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista) {
      throw new Error('Artista não encontrado');
    }

    if (artista.tipo !== 'artista') {
      throw new Error('Apenas artistas podem assinar o plano Pro');
    }

    // Verificar se já tem assinatura ativa
    const { data: existingSub } = await supabase
      .from('artist_subscriptions')
      .select('id, status, ends_at')
      .eq('artista_id', artista_id)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())
      .single();

    if (existingSub) {
      throw new Error('Você já possui uma assinatura ativa');
    }

    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Gerar UUID da assinatura
    const subscriptionId = crypto.randomUUID();
    const valorAssinatura = 39.90;

    // Criar pagamento único mensal via Pix
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

    console.log('Creating subscription payment...');

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
      const errorBody = await mpResponse.text();
      console.error('Mercado Pago error:', errorBody);
      throw new Error('Erro ao criar pagamento da assinatura');
    }

    const mpData = await mpResponse.json();
    console.log('Subscription payment created:', mpData.id);

    // Calcular data de expiração (30 dias a partir de agora, será ativada quando pago)
    const startsAt = null; // Será definido quando o pagamento for aprovado
    const endsAt = null;

    // Criar registro da assinatura pendente
    const { data: subscription, error: subError } = await supabase
      .from('artist_subscriptions')
      .insert({
        id: subscriptionId,
        artista_id,
        status: 'pending',
        starts_at: startsAt,
        ends_at: endsAt,
        payment_id: mpData.id.toString(),
        valor: valorAssinatura,
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      throw new Error('Erro ao criar assinatura');
    }

    console.log('Subscription created:', subscription.id);

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
    console.error('Error in create-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
