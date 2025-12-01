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
    const url = new URL(req.url);
    const gorjetaId = url.searchParams.get('gorjeta_id');

    if (!gorjetaId) {
      throw new Error('gorjeta_id é obrigatório');
    }

    // Validar que gorjetaId é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(gorjetaId)) {
      throw new Error('gorjeta_id inválido');
    }

    console.log('Checking payment status for gorjeta:', gorjetaId);

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar gorjeta
    const { data: gorjeta, error: findError } = await supabase
      .from('gorjetas')
      .select('*')
      .eq('id', gorjetaId)
      .single();

    if (findError || !gorjeta) {
      throw new Error('Gorjeta não encontrada');
    }

    // Se ainda estiver pendente, consultar API do Mercado Pago
    if (gorjeta.status_pagamento === 'pending' && gorjeta.payment_id) {
      const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      if (!mercadoPagoToken) {
        throw new Error('Token do Mercado Pago não configurado');
      }

      console.log('Checking status on Mercado Pago for payment:', gorjeta.payment_id);

      try {
        // Buscar status do pagamento usando API REST diretamente
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

        if (!response.ok) {
          console.error('MP API error:', response.status, await response.text());
          throw new Error(`Mercado Pago API error: ${response.status}`);
        }

        const paymentData = await response.json();
        console.log('Payment status from MP:', paymentData.status);

        // Atualizar status se mudou
        let newStatus = 'pending';
        if (paymentData.status === 'approved') {
          newStatus = 'approved';
        } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
          newStatus = 'rejected';
        }

        if (newStatus !== gorjeta.status_pagamento) {
          console.log('Updating status to:', newStatus);
          const { error: updateError } = await supabase
            .from('gorjetas')
            .update({ status_pagamento: newStatus })
            .eq('id', gorjetaId);

          if (updateError) {
            console.error('Error updating status:', updateError);
          } else {
            gorjeta.status_pagamento = newStatus;
          }
        }
      } catch (error) {
        console.error('Error fetching payment from MP:', error);
        // Continuar com o status atual se falhar
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
    console.error('Error in check-payment-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});