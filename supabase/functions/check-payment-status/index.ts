import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
};

// Generic error messages for security
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

    // Validate gorjeta_id
    if (!gorjetaId) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INVALID_REQUEST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate UUID format
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

    // Fetch gorjeta with session validation
    const { data: gorjeta, error: findError } = await supabase
      .from('gorjetas')
      .select('id, status_pagamento, expires_at, payment_id, session_id')
      .eq('id', gorjetaId)
      .single();

    if (findError || !gorjeta) {
      // Return generic error to prevent enumeration attacks
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.NOT_FOUND }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Validate session_id matches (for anonymous users)
    if (gorjeta.session_id && sessionId && gorjeta.session_id !== sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.NOT_FOUND }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // If still pending and has payment_id, check with Mercado Pago
    if (gorjeta.status_pagamento === 'pending' && gorjeta.payment_id) {
      const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      if (!mercadoPagoToken) {
        console.error('[INTERNAL] MP token not configured');
        // Return current status instead of error
        return new Response(
          JSON.stringify({
            success: true,
            status: gorjeta.status_pagamento,
            expires_at: gorjeta.expires_at,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      try {
        const response = await fetch(
          `https://api.mercadopago.com/v1/payments/${gorjeta.payment_id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${mercadoPagoToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const paymentData = await response.json();
          console.log('Payment status from MP:', paymentData.status);

          let newStatus = 'pending';
          if (paymentData.status === 'approved') {
            newStatus = 'approved';
          } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
            newStatus = 'rejected';
          }

          if (newStatus !== gorjeta.status_pagamento) {
            await supabase
              .from('gorjetas')
              .update({ status_pagamento: newStatus })
              .eq('id', gorjetaId);
            
            gorjeta.status_pagamento = newStatus;
          }
        }
      } catch (error) {
        console.error('[INTERNAL] MP API error:', error);
        // Continue with current status
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
