import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
};

interface PaymentRequest {
  valor: number;
  artista_id: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  cliente_cpf?: string | null;
  session_id?: string;
  pedido_musica?: string | null;
  pedido_mensagem?: string | null;
  device_id?: string | null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { valor, artista_id, cliente_id, cliente_nome, cliente_cpf, session_id, pedido_musica, pedido_mensagem, device_id }: PaymentRequest = await req.json();

    console.log('Creating Pix payment:', { valor, artista_id, cliente_id, cliente_nome, cliente_cpf, session_id, pedido_musica, pedido_mensagem, device_id });

    // Validações básicas
    if (!valor || valor <= 0) {
      throw new Error('Valor inválido');
    }

    if (!artista_id) {
      throw new Error('ID do artista é obrigatório');
    }

    // Validar que artista_id é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(artista_id)) {
      throw new Error('ID do artista inválido');
    }

    // Validar que temos identificação (cliente_id ou session_id)
    if (!cliente_id && !session_id) {
      throw new Error('É necessário fornecer cliente_id ou session_id');
    }

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar informações do artista incluindo mercadopago_seller_id
    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('nome, id, mercadopago_seller_id, tipo')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista) {
      throw new Error('Artista não encontrado');
    }

    // Validar que o perfil é realmente um artista
    if (artista.tipo !== 'artista') {
      throw new Error('Perfil não é um artista');
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

    // Gerar UUID da gorjeta ANTES de criar o pagamento para usar como external_reference
    const gorjetaId = crypto.randomUUID();
    
    // Construir dados do pagamento para Pix
    const clienteNome = cliente_nome || 'Cliente';
    const nomePartes = clienteNome.split(' ');
    const firstName = nomePartes[0] || 'Cliente';
    const lastName = nomePartes.slice(1).join(' ') || 'Anônimo';
    
    const paymentData: any = {
      transaction_amount: valorTotal, // Cobrar valor total (bruto + taxa processamento)
      description: `Gorjeta para ${artista.nome}`,
      payment_method_id: 'pix',
      statement_descriptor: 'GORJETA ARTISTA', // Aparece no extrato do cliente
      external_reference: gorjetaId, // Usar o ID da gorjeta como referência para correlação
      payer: {
        email: 'cliente@example.com', // Email genérico (pode ser melhorado futuramente)
        first_name: firstName,
        last_name: lastName,
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };
    
    // Adicionar CPF se fornecido
    if (cliente_cpf) {
      paymentData.payer.identification = {
        type: 'CPF',
        number: cliente_cpf,
      };
      console.log('CPF adicionado ao pagamento:', cliente_cpf);
    }

    // Se o artista tem Mercado Pago vinculado, usar split de pagamento direto
    if (artista.mercadopago_seller_id) {
      console.log('Configurando split payment para seller:', artista.mercadopago_seller_id);
      
      // Usar headers de marketplace para split payment
      paymentData.marketplace = 'NONE'; // Indica que não é marketplace, mas split direto
      paymentData.marketplace_fee = taxaPlataforma; // Taxa da plataforma (10%)
      
      // Configurar o collector (quem recebe) como o artista
      paymentData.collector_id = parseInt(artista.mercadopago_seller_id);
      
      console.log('Split payment configurado:', {
        marketplace_fee: paymentData.marketplace_fee,
        collector_id: paymentData.collector_id,
        valor_total: valorTotal,
        valor_artista_recebe: valorLiquidoArtista,
        valor_plataforma_recebe: taxaPlataforma,
      });
    } else {
      console.log('Artista sem Mercado Pago vinculado - pagamento vai direto para plataforma');
    }

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
      console.error('Mercado Pago API error:', {
        status: mpResponse.status,
        statusText: mpResponse.statusText,
        error: errorText,
        paymentData: { ...paymentData, payer: { ...paymentData.payer, identification: cliente_cpf ? 'CPF fornecido' : 'CPF não fornecido' } }
      });
      
      // Tentar parsear erro do Mercado Pago
      try {
        const errorJson = JSON.parse(errorText);
        const errorMessage = errorJson.message || errorJson.error || 'Erro desconhecido';
        throw new Error(`Erro Mercado Pago: ${errorMessage}`);
      } catch {
        throw new Error(`Erro ao criar pagamento (${mpResponse.status})`);
      }
    }

    const mpData = await mpResponse.json();
    console.log('Mercado Pago response:', mpData);

    // Calcular expiração (30 minutos)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Inserir gorjeta no banco com dados do pagamento e valores calculados
    const { data: gorjeta, error: gorjetaError } = await supabase
      .from('gorjetas')
      .insert({
        id: gorjetaId, // Usar o mesmo UUID enviado como external_reference
        valor: valorBruto, // Valor bruto (sem taxa de processamento)
        valor_liquido_artista: valorLiquidoArtista, // 90% do valor bruto
        taxa_plataforma: taxaPlataforma, // 10% do valor bruto
        artista_id,
        cliente_id: cliente_id || null,
        cliente_nome: cliente_nome || null,
        session_id: session_id || null,
        payment_id: mpData.id.toString(),
        status_pagamento: 'pending',
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code || '',
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || '',
        expires_at: expiresAt,
        pedido_musica: pedido_musica || null,
        pedido_mensagem: pedido_mensagem || null,
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
        id: gorjeta.id,
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
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
