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

// Encryption utilities using AES-GCM
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('ENCRYPTION_KEY');
  if (!keyString || keyString.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString.slice(0, 32));
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function decryptData(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Decode base64
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

async function encryptData(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Função auxiliar para verificar se string está criptografada (base64 com tamanho esperado)
function isEncrypted(value: string): boolean {
  try {
    const decoded = atob(value);
    // Encrypted tokens should be longer than raw tokens due to IV + encryption overhead
    return decoded.length > 50 && value.length > 100;
  } catch {
    return false;
  }
}

// Função auxiliar para obter token válido do artista (com refresh se necessário)
async function getValidSellerToken(
  credentials: any,
  artistId: string,
  supabase: any
): Promise<string | null> {
  if (!credentials?.access_token) {
    return null;
  }

  // Descriptografar token se estiver criptografado
  let accessToken = credentials.access_token;
  let refreshToken = credentials.refresh_token;
  
  try {
    if (isEncrypted(accessToken)) {
      console.log('Descriptografando access_token...');
      accessToken = await decryptData(accessToken);
    }
    if (refreshToken && isEncrypted(refreshToken)) {
      refreshToken = await decryptData(refreshToken);
    }
  } catch (decryptError) {
    console.error('Erro ao descriptografar tokens:', decryptError);
    return null;
  }

  // Verificar se token ainda é válido (com margem de 5 minutos)
  const expiresAt = new Date(credentials.token_expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt > fiveMinutesFromNow) {
    console.log('Token do artista ainda válido até:', expiresAt.toISOString());
    return accessToken;
  }

  // Token expirado ou prestes a expirar - fazer refresh
  console.log('Token expirado, fazendo refresh...');

  const clientId = Deno.env.get('MERCADO_PAGO_CLIENT_ID');
  const clientSecret = Deno.env.get('MERCADO_PAGO_CLIENT_SECRET');

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('Não é possível fazer refresh: credenciais ou refresh_token ausentes');
    return null;
  }

  try {
    const refreshResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }).toString(),
    });

    const refreshData = await refreshResponse.json();

    if (!refreshResponse.ok || !refreshData.access_token) {
      console.error('Erro ao fazer refresh do token:', refreshData);
      return null;
    }

    // Calcular nova data de expiração
    const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();

    // Criptografar novos tokens antes de salvar
    const encryptedAccessToken = await encryptData(refreshData.access_token);
    const encryptedRefreshToken = await encryptData(refreshData.refresh_token);

    // Atualizar tokens no banco (tabela de credenciais)
    const { error: updateError } = await supabase
      .from('artist_mercadopago_credentials')
      .update({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('artist_id', artistId);

    if (updateError) {
      console.error('Erro ao atualizar tokens no banco:', updateError);
    } else {
      console.log('Tokens atualizados com sucesso! Novo token expira em:', newExpiresAt);
    }

    return refreshData.access_token;
  } catch (error) {
    console.error('Erro no refresh de token:', error);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      valor,
      artista_id,
      cliente_id,
      cliente_nome,
      cliente_cpf,
      session_id,
      pedido_musica,
      pedido_mensagem,
      device_id,
    }: PaymentRequest = await req.json();

    console.log('Creating Pix payment:', {
      valor,
      artista_id,
      cliente_id,
      cliente_nome,
      cliente_cpf: cliente_cpf ? '***' : null, // Não logar CPF completo
      session_id: session_id ? '***' : null, // Não logar session_id completo
      pedido_musica,
      pedido_mensagem,
      device_id,
    });

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

    // Validar formato do session_id se fornecido (deve ser UUID)
    if (session_id && !uuidRegex.test(session_id)) {
      throw new Error('Session ID deve ser um UUID válido');
    }

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Buscar informações do artista (sem tokens sensíveis)
    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('nome, id, tipo, plano')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista) {
      throw new Error('Artista não encontrado');
    }

    // Validar que o perfil é realmente um artista
    if (artista.tipo !== 'artista') {
      throw new Error('Perfil não é um artista');
    }

    // Buscar credenciais do Mercado Pago da tabela segura
    const { data: credentials } = await supabase
      .from('artist_mercadopago_credentials')
      .select('seller_id, access_token, refresh_token, token_expires_at')
      .eq('artist_id', artista_id)
      .maybeSingle();

    // Token da plataforma (fallback)
    const platformToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!platformToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Verificar se artista é Pro (tem assinatura ativa)
    const { data: activeSubscription } = await supabase
      .from('artist_subscriptions')
      .select('id')
      .eq('artista_id', artista_id)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())
      .single();

    const isPro = artista.plano === 'pro' && !!activeSubscription;
    const taxaPercentual = isPro ? 0 : 0.20; // Pro: 0%, Free: 20%

    console.log('Artist plan:', { plano: artista.plano, isPro, taxaPercentual });

    // Calcular valores com taxa da plataforma dinâmica
    const valorBruto = valor;
    const taxaPlataforma = Number((valorBruto * taxaPercentual).toFixed(2));
    const valorLiquidoArtista = Number((valorBruto * (1 - taxaPercentual)).toFixed(2));
    const valorTotal = valorBruto;

    // Gerar UUID da gorjeta ANTES de criar o pagamento
    const gorjetaId = crypto.randomUUID();

    // Construir dados do pagamento para Pix
    const nomeCliente = cliente_nome || 'Cliente';
    const nomePartes = nomeCliente.split(' ');
    const firstName = nomePartes[0] || 'Cliente';
    const lastName = nomePartes.slice(1).join(' ') || 'Anônimo';

    // Verificar se artista tem token OAuth válido para split payment
    const sellerToken = await getValidSellerToken(credentials, artista_id, supabase);
    const useSellerToken = sellerToken && credentials?.seller_id;

    // Token a ser usado na requisição
    const tokenToUse = useSellerToken ? sellerToken : platformToken;

    const paymentData: any = {
      transaction_amount: valorTotal,
      description: `Gorjeta para ${artista.nome}`,
      payment_method_id: 'pix',
      statement_descriptor: 'GORJETA ARTISTA',
      external_reference: gorjetaId,
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
          },
        ],
        payer: {
          first_name: firstName,
          last_name: lastName,
        },
      },
      payer: {
        email: 'cliente@example.com',
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
      console.log('CPF adicionado ao pagamento');
    }

    // Configurar split payment corretamente
    if (useSellerToken && taxaPlataforma > 0) {
      paymentData.application_fee = taxaPlataforma;
      console.log('Split payment com token do artista:', {
        application_fee: taxaPlataforma,
        valor_total: valorTotal,
        valor_artista_recebe: valorLiquidoArtista,
        valor_plataforma_recebe: taxaPlataforma,
      });
    } else if (useSellerToken) {
      console.log('Artista Pro - 100% do pagamento vai para o artista');
    } else {
      console.log('Artista sem token OAuth - pagamento vai para plataforma');
    }

    console.log('Chamando API do Mercado Pago via fetch...');
    console.log('Usando token:', useSellerToken ? 'do artista' : 'da plataforma');

    // Gerar chave de idempotência única
    const idempotencyKey = crypto.randomUUID();

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenToUse}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    console.log('Mercado Pago raw response status:', mpResponse.status);

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text();
      console.error('Mercado Pago error body:', errorBody);
      throw new Error('Erro ao criar pagamento Pix no Mercado Pago');
    }

    const mpData: any = await mpResponse.json();
    console.log('Mercado Pago response - Payment ID:', mpData.id);

    // Calcular expiração (30 minutos)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Inserir gorjeta no banco com dados do pagamento e valores calculados
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
        payment_id: mpData.id ? mpData.id.toString() : null,
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

    console.log('Gorjeta created successfully:', gorjeta.id);

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
      },
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
      },
    );
  }
});
