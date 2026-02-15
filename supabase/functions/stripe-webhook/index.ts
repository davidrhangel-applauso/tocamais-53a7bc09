import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // If we have a webhook secret, verify the signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }
    } else {
      // Without webhook secret, parse the event directly (less secure but works)
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log('Stripe webhook received:', event.type);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      console.log('Checkout completed:', session.id, 'metadata:', metadata);

      if (metadata.tipo === 'gorjeta' && metadata.gorjeta_id) {
        // Update gorjeta status
        const { error: updateError } = await supabase
          .from('gorjetas')
          .update({
            status_pagamento: 'approved',
            payment_id: session.payment_intent as string || session.id,
          })
          .eq('id', metadata.gorjeta_id);

        if (updateError) {
          console.error('Error updating gorjeta:', updateError);
        } else {
          console.log('Gorjeta approved:', metadata.gorjeta_id);
        }
      } else if (metadata.tipo === 'subscription' && metadata.subscription_id) {
        // Handle subscription payment
        const now = new Date();
        const durationDays = parseInt(metadata.duration_days || '30');
        const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const { error: updateSubError } = await supabase
          .from('artist_subscriptions')
          .update({
            status: 'active',
            starts_at: now.toISOString(),
            ends_at: endsAt.toISOString(),
            payment_id: session.payment_intent as string || session.id,
          })
          .eq('id', metadata.subscription_id);

        if (updateSubError) {
          console.error('Error updating subscription:', updateSubError);
        } else {
          // Update artist plan to pro
          if (metadata.artista_id) {
            await supabase
              .from('profiles')
              .update({ plano: 'pro' })
              .eq('id', metadata.artista_id);

            // Create notification
            await supabase.rpc('criar_notificacao', {
              p_usuario_id: metadata.artista_id,
              p_tipo: 'assinatura',
              p_titulo: 'Plano Pro Ativado! 🎉',
              p_mensagem: 'Sua assinatura Pro foi ativada. Agora você recebe 100% das gorjetas!',
              p_link: '/configuracoes',
            });
          }
          console.log('Subscription activated:', metadata.subscription_id);
        }
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      if (metadata.tipo === 'gorjeta' && metadata.gorjeta_id) {
        await supabase
          .from('gorjetas')
          .update({ status_pagamento: 'rejected' })
          .eq('id', metadata.gorjeta_id);
        console.log('Gorjeta expired:', metadata.gorjeta_id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
