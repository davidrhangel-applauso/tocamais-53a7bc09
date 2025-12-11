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
  
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
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

// Função auxiliar para verificar se string está criptografada
function isEncrypted(value: string): boolean {
  try {
    const decoded = atob(value);
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

    console.log('Processing card payment:', { 
      payment_method_id, 
      valor, 
      artista_id,
      cliente_id: cliente_id ? '***' : null,
      session_id: session_id ? '***' : null,
    });

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

    // Validar formato do session_id se fornecido (deve ser UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (session_id && !uuidRegex.test(session_id)) {
      throw new Error('Session ID deve ser um UUID válido');
    }

    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar informações do artista (sem tokens sensíveis)
    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('nome, id, tipo, plano')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista || artista.tipo !== 'artista') {
      throw new Error('Artista não encontrado');
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
    const taxaPercentual = isPro ? 0 : 0.20;

    console.log('Artist plan:', { plano: artista.plano, isPro, taxaPercentual });

    // Calcular valores
    const valorBruto = valor;
    const taxaPlataforma = Number((valorBruto * taxaPercentual).toFixed(2));
    const valorLiquidoArtista = Number((valorBruto * (1 - taxaPercentual)).toFixed(2));
    const valorTotal = valorBruto;

    // Garantir que installments seja numérico
    const installmentsNumber =
      typeof installments === 'string' ? parseInt(installments, 10) : installments;

    if (!installmentsNumber || isNaN(installmentsNumber)) {
      throw new Error('Número de parcelas inválido');
    }

    // Gerar UUID da gorjeta
    const gorjetaId = crypto.randomUUID();

    // Verificar se artista tem token OAuth válido para split payment
    const sellerToken = await getValidSellerToken(credentials, artista_id, supabase);
    const useSellerToken = sellerToken && credentials?.seller_id;

    // Token a ser usado na requisição
    const tokenToUse = useSellerToken ? sellerToken : platformToken;

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

    console.log('Criando pagamento com cartão...');
    console.log('Usando token:', useSellerToken ? 'do artista' : 'da plataforma');

    // Gerar chave de idempotência
    const idempotencyKey = crypto.randomUUID();

    // Criar pagamento usando API REST diretamente
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenToUse}`,
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
        qr_code: null,
        qr_code_base64: null,
        expires_at: null,
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
