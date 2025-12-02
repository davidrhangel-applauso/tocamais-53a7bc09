import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CardPaymentRequest {
  token: string;
  payment_method_id: string;
  issuer_id: string;
  installments: number | string;
  valor: number;
  artista_id: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  session_id?: string;
  pedido_musica?: string | null;
  pedido_mensagem?: string | null;
  device_id?: string | null;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      token,
      payment_method_id,
      issuer_id,
      installments,
      valor,
      artista_id,
      cliente_id,
      cliente_nome,
      session_id,
      pedido_musica,
      pedido_mensagem,
      device_id,
      payer,
    }: CardPaymentRequest = await req.json();

    console.log('Processing card payment:', { payment_method_id, valor, artista_id });

    // Validações
    if (!token || !payment_method_id || !valor || !artista_id) {
      throw new Error('Dados obrigatórios ausentes');
    }

    if (!payer || !payer.email || !payer.identification || !payer.identification.type || !payer.identification.number) {
      throw new Error('Informações do pagador são obrigatórias');
    }

    if (!cliente_id && !session_id) {
      throw new Error('É necessário fornecer cliente_id ou session_id');
    }

    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar informações do artista
    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('nome, id, mercadopago_seller_id, tipo')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista || artista.tipo !== 'artista') {
      throw new Error('Artista não encontrado');
    }

    // Token do Mercado Pago
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Calcular valores
    const valorBruto = valor;
    const taxaPlataforma = Number((valorBruto * 0.10).toFixed(2));
    const valorLiquidoArtista = Number((valorBruto * 0.90).toFixed(2));
    const taxaProcessamento = Number((valorBruto * 0.01).toFixed(2));
    const valorTotal = Number((valorBruto + taxaProcessamento).toFixed(2));

    // Garantir que installments seja numérico
    const installmentsNumber =
      typeof installments === 'string' ? parseInt(installments, 10) : installments;

    if (!installmentsNumber || isNaN(installmentsNumber)) {
      throw new Error('Número de parcelas inválido');
    }

    // Gerar UUID da gorjeta
    const gorjetaId = crypto.randomUUID();

    // Preparar dados do pagamento
    const paymentData: any = {
      transaction_amount: valorTotal,
      token,
      description: `Gorjeta para ${artista.nome}`,
      installments: installmentsNumber,
      payment_method_id,
      issuer_id,
      payer: {
        email: payer.email,
        identification: {
          type: payer.identification.type,
          number: payer.identification.number,
        },
      },
      external_reference: gorjetaId,
      statement_descriptor: 'GORJETA ARTISTA',
      additional_info: {
        items: [
          {
            id: gorjetaId,
            title: `Gorjeta para ${artista.nome}`,
            description: pedido_musica 
              ? `Gorjeta com pedido musical: ${pedido_musica}` 
              : `Gorjeta para o artista ${artista.nome}`,
            quantity: 1,
            unit_price: valorTotal,
            category_id: 'entertainment',
          }
        ],
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

    // Adicionar device_id se fornecido
    if (device_id) {
      paymentData.metadata = { device_id };
    }

    // Configurar split payment se artista tiver Mercado Pago vinculado
    if (artista.mercadopago_seller_id) {
      console.log('Configurando split payment para seller:', artista.mercadopago_seller_id);
      paymentData.marketplace = 'NONE';
      paymentData.marketplace_fee = taxaPlataforma;
      paymentData.collector_id = parseInt(artista.mercadopago_seller_id);
    }

    console.log('Criando pagamento com cartão...');

    // Gerar chave de idempotência
    const idempotencyKey = crypto.randomUUID();

    // Criar pagamento usando API REST diretamente
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MP API error:', response.status, errorText);
      throw new Error(`Erro ao criar pagamento: ${response.status} - ${errorText}`);
    }

    const mpData = await response.json();
    console.log('Pagamento criado:', mpData.id, 'Status:', mpData.status);

    // Salvar gorjeta no banco
    const { data: gorjeta, error: gorjetaError } = await supabase
      .from('gorjetas')
      .insert({
        id: gorjetaId,
        valor: valorBruto,
        valor_liquido_artista: valorLiquidoArtista,
        taxa_plataforma: taxaPlataforma,
        artista_id,
        cliente_id: cliente_id || null,
        cliente_nome: cliente_nome || null,
        session_id: session_id || null,
        payment_id: mpData.id!.toString(),
        status_pagamento: mpData.status || 'pending',
        qr_code: null, // Pagamento com cartão não tem QR code
        qr_code_base64: null,
        expires_at: null, // Pagamento com cartão não expira
        pedido_musica: pedido_musica || null,
        pedido_mensagem: pedido_mensagem || null,
      })
      .select()
      .single();

    if (gorjetaError) {
      console.error('Error inserting gorjeta:', gorjetaError);
      throw new Error('Erro ao salvar gorjeta no banco');
    }

    console.log('Gorjeta salva:', gorjeta.id);

    return new Response(
      JSON.stringify({
        id: gorjeta.id,
        payment_id: mpData.id,
        status: mpData.status,
        status_detail: mpData.status_detail,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in process-card-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
