import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  valor: number;
  artista_id: string;
  cliente_id: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { valor, artista_id, cliente_id }: PaymentRequest = await req.json();

    console.log('Creating Pix payment:', { valor, artista_id, cliente_id });

    // Validações básicas
    if (!valor || valor <= 0) {
      throw new Error('Valor inválido');
    }

    if (!artista_id || !cliente_id) {
      throw new Error('IDs de artista e cliente são obrigatórios');
    }

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar informações do artista
    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('nome, id')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista) {
      throw new Error('Artista não encontrado');
    }

    // Criar pagamento no Mercado Pago
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Calcular valores com taxa da plataforma (10%) e taxa de processamento (1%)
    const valorBruto = valor; // Valor que o cliente deseja enviar
    const taxaPlataforma = Number((valorBruto * 0.10).toFixed(2)); // 10% para a plataforma
    const valorLiquidoArtista = Number((valorBruto * 0.90).toFixed(2)); // 90% para o artista
    const taxaProcessamento = Number((valorBruto * 0.01).toFixed(2)); // 1% taxa Mercado Pago
    const valorTotal = Number((valorBruto + taxaProcessamento).toFixed(2)); // Total a cobrar do cliente

    const paymentData = {
      transaction_amount: valorTotal, // Cobrar valor total (bruto + taxa processamento)
      description: `Gorjeta para ${artista.nome}`,
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@example.com', // Email genérico
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

    console.log('Calling Mercado Pago API...');

    // Gerar chave de idempotência única
    const idempotencyKey = crypto.randomUUID();

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Mercado Pago error:', errorText);
      throw new Error(`Erro ao criar pagamento: ${mpResponse.status}`);
    }

    const mpData = await mpResponse.json();
    console.log('Mercado Pago response:', mpData);

    // Calcular expiração (30 minutos)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Inserir gorjeta no banco com dados do pagamento e valores calculados
    const { data: gorjeta, error: gorjetaError } = await supabase
      .from('gorjetas')
      .insert({
        valor: valorBruto, // Valor bruto (sem taxa de processamento)
        valor_liquido_artista: valorLiquidoArtista, // 90% do valor bruto
        taxa_plataforma: taxaPlataforma, // 10% do valor bruto
        artista_id,
        cliente_id,
        payment_id: mpData.id.toString(),
        status_pagamento: 'pending',
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code || '',
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || '',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (gorjetaError) {
      console.error('Error inserting gorjeta:', gorjetaError);
      throw new Error('Erro ao salvar gorjeta no banco');
    }

    console.log('Gorjeta created successfully:', gorjeta);

    return new Response(
      JSON.stringify({
        success: true,
        gorjeta_id: gorjeta.id,
        payment_id: mpData.id,
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        expires_at: expiresAt,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-pix-payment:', error);
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
