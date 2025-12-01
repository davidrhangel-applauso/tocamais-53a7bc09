import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifySignature(req: Request, body: any): Promise<boolean> {
  const signature = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');
  
  if (!signature || !requestId) {
    console.error('Missing signature headers');
    return false;
  }

  const secret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');
  if (!secret) {
    console.error('MERCADO_PAGO_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    // Mercado Pago envia: ts=timestamp,v1=hash
    const parts = signature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    
    if (!ts || !hash) {
      console.error('Invalid signature format');
      return false;
    }

    // Criar string de manifest: id;request-id;ts
    const dataId = body.data?.id || body.id;
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    
    // Calcular HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(manifest);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature_bytes = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const calculatedHash = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const isValid = calculatedHash === hash;
    if (!isValid) {
      console.error('Signature verification failed');
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    // Verificar assinatura
    const isValidSignature = await verifySignature(req, body);
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Mercado Pago envia notificações de diferentes tipos
    // Apenas processar notificações do tipo 'payment'
    if (body.type !== 'payment' && body.action !== 'payment.updated' && body.action !== 'payment.created') {
      console.log('Ignoring non-payment notification');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extrair payment ID
    const paymentId = body.data?.id || body.id;
    
    if (!paymentId) {
      console.error('No payment ID in webhook');
      return new Response(JSON.stringify({ error: 'No payment ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Processing payment ID:', paymentId);

    // Token do Mercado Pago
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Buscar detalhes do pagamento usando API REST diretamente
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
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
    console.log('Payment data from MP:', JSON.stringify(paymentData));

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar gorjeta pelo payment_id primeiro
    let { data: gorjeta, error: findError } = await supabase
      .from('gorjetas')
      .select('*')
      .eq('payment_id', paymentId.toString())
      .maybeSingle();

    // Se não encontrar por payment_id, tentar por external_reference (que é o id da gorjeta)
    if (!gorjeta && paymentData.external_reference) {
      console.log('Gorjeta not found by payment_id, trying external_reference:', paymentData.external_reference);
      const { data: gorjetaByRef, error: refError } = await supabase
        .from('gorjetas')
        .select('*')
        .eq('id', paymentData.external_reference)
        .maybeSingle();
      
      gorjeta = gorjetaByRef;
      findError = refError;
    }

    if (findError || !gorjeta) {
      console.error('Gorjeta not found for payment_id or external_reference:', paymentId);
      return new Response(JSON.stringify({ error: 'Gorjeta not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Mapear status do Mercado Pago
    let newStatus = 'pending';
    if (paymentData.status === 'approved') {
      newStatus = 'approved';
    } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
      newStatus = 'rejected';
    }

    console.log('Updating gorjeta status to:', newStatus);

    // Atualizar status da gorjeta
    const { error: updateError } = await supabase
      .from('gorjetas')
      .update({ status_pagamento: newStatus })
      .eq('id', gorjeta.id);

    if (updateError) {
      console.error('Error updating gorjeta:', updateError);
      throw new Error('Erro ao atualizar status da gorjeta');
    }

    console.log('Webhook processed successfully');

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in mercadopago-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});