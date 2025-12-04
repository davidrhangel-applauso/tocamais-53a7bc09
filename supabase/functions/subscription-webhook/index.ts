import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Subscription webhook received:', JSON.stringify(body));

    const { type, data } = body;

    if (type !== 'payment') {
      console.log('Ignoring non-payment notification:', type);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.log('No payment ID in webhook');
      return new Response(JSON.stringify({ error: 'No payment ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Buscar detalhes do pagamento
    console.log('Fetching payment details:', paymentId);
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mercadoPagoToken}`,
      },
    });

    if (!mpResponse.ok) {
      throw new Error('Erro ao buscar pagamento');
    }

    const payment = await mpResponse.json();
    console.log('Payment details:', payment.id, payment.status, payment.external_reference);

    // Verificar se é uma assinatura (external_reference começa com sub_)
    if (!payment.external_reference?.startsWith('sub_')) {
      console.log('Not a subscription payment, ignoring');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const subscriptionId = payment.external_reference.replace('sub_', '');
    console.log('Processing subscription:', subscriptionId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Buscar assinatura
    const { data: subscription, error: subError } = await supabase
      .from('artist_subscriptions')
      .select('*, artista_id')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return new Response(JSON.stringify({ error: 'Subscription not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Atualizar status baseado no pagamento
    if (payment.status === 'approved') {
      const now = new Date();
      const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

      // Atualizar assinatura
      const { error: updateSubError } = await supabase
        .from('artist_subscriptions')
        .update({
          status: 'active',
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateSubError) {
        console.error('Error updating subscription:', updateSubError);
        throw new Error('Erro ao atualizar assinatura');
      }

      // Atualizar plano do artista para Pro
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ plano: 'pro' })
        .eq('id', subscription.artista_id);

      if (updateProfileError) {
        console.error('Error updating profile:', updateProfileError);
        throw new Error('Erro ao atualizar perfil');
      }

      // Criar notificação
      await supabase.rpc('criar_notificacao', {
        p_usuario_id: subscription.artista_id,
        p_tipo: 'assinatura',
        p_titulo: 'Plano Pro Ativado! 🎉',
        p_mensagem: 'Sua assinatura Pro foi ativada. Agora você recebe 100% das gorjetas!',
        p_link: '/configuracoes',
      });

      console.log('Subscription activated:', subscriptionId);
    } else if (payment.status === 'cancelled' || payment.status === 'rejected') {
      // Cancelar assinatura
      const { error: updateSubError } = await supabase
        .from('artist_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId);

      if (updateSubError) {
        console.error('Error cancelling subscription:', updateSubError);
      }

      console.log('Subscription cancelled:', subscriptionId);
    }

    return new Response(JSON.stringify({ received: true, processed: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in subscription-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
