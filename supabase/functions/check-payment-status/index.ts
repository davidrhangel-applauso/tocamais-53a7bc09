import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
};

const ERROR_MESSAGES = {
  INVALID_REQUEST: 'Requisição inválida',
  NOT_FOUND: 'Pagamento não encontrado',
  INTERNAL_ERROR: 'Erro interno. Tente novamente.',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const gorjetaId = url.searchParams.get('gorjeta_id');
    const sessionId = req.headers.get('x-session-id');

    if (!gorjetaId) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INVALID_REQUEST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(gorjetaId)) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INVALID_REQUEST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Checking payment status for gorjeta:', gorjetaId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: gorjeta, error: findError } = await supabase
      .from('gorjetas')
      .select('id, status_pagamento, expires_at, payment_id, session_id')
      .eq('id', gorjetaId)
      .single();

    if (findError || !gorjeta) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.NOT_FOUND }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (gorjeta.session_id && sessionId && gorjeta.session_id !== sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.NOT_FOUND }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // If still pending and has payment_id, check with Stripe
    if (gorjeta.status_pagamento === 'pending' && gorjeta.payment_id) {
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
          
          // payment_id could be a checkout session ID or payment intent ID
          if (gorjeta.payment_id.startsWith('cs_')) {
            const session = await stripe.checkout.sessions.retrieve(gorjeta.payment_id);
            if (session.payment_status === 'paid') {
              await supabase
                .from('gorjetas')
                .update({ 
                  status_pagamento: 'approved',
                  payment_id: (session.payment_intent as string) || gorjeta.payment_id,
                })
                .eq('id', gorjetaId);
              gorjeta.status_pagamento = 'approved';
            } else if (session.status === 'expired') {
              await supabase
                .from('gorjetas')
                .update({ status_pagamento: 'rejected' })
                .eq('id', gorjetaId);
              gorjeta.status_pagamento = 'rejected';
            }
          }
        } catch (error) {
          console.error('[INTERNAL] Stripe API error:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: gorjeta.status_pagamento,
        expires_at: gorjeta.expires_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[INTERNAL] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
