import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generic error messages for security
const ERROR_MESSAGES = {
  MISSING_DATA: 'Dados obrigatórios ausentes',
  INVALID_PAYER: 'Informações do pagador são obrigatórias',
  MISSING_ID: 'Identificação necessária',
  INVALID_ARTIST: 'Artista não encontrado',
  INVALID_INSTALLMENTS: 'Número de parcelas inválido',
  PAYMENT_FAILED: 'Não foi possível processar o pagamento. Tente novamente.',
  INTERNAL_ERROR: 'Erro interno. Tente novamente mais tarde.',
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

async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('ENCRYPTION_KEY');
  if (!keyString || keyString.length < 32) {
    throw new Error('Encryption configuration error');
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

function isEncrypted(value: string): boolean {
  try {
    const decoded = atob(value);
    return decoded.length > 50 && value.length > 100;
  } catch {
    return false;
  }
}

async function getValidSellerToken(
  credentials: any,
  artistId: string,
  supabase: any
): Promise<string | null> {
  if (!credentials?.access_token) {
    return null;
  }

  let accessToken = credentials.access_token;
  let refreshToken = credentials.refresh_token;
  
  try {
    if (isEncrypted(accessToken)) {
      accessToken = await decryptData(accessToken);
    }
    if (refreshToken && isEncrypted(refreshToken)) {
      refreshToken = await decryptData(refreshToken);
    }
  } catch (decryptError) {
    console.error('[INTERNAL] Token decryption error');
    return null;
  }

  const expiresAt = new Date(credentials.token_expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt > fiveMinutesFromNow) {
    return accessToken;
  }

  console.log('Token expired, refreshing...');

  const clientId = Deno.env.get('MERCADO_PAGO_CLIENT_ID');
  const clientSecret = Deno.env.get('MERCADO_PAGO_CLIENT_SECRET');

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('[INTERNAL] Missing refresh credentials');
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
      console.error('[INTERNAL] Token refresh failed');
      return null;
    }

    const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();
    const encryptedAccessToken = await encryptData(refreshData.access_token);
    const encryptedRefreshToken = await encryptData(refreshData.refresh_token);

    await supabase
      .from('artist_mercadopago_credentials')
      .update({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('artist_id', artistId);

    return refreshData.access_token;
  } catch (error) {
    console.error('[INTERNAL] Token refresh error:', error);
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

    console.log('Processing card payment');

    // Validations
    if (!token || !payment_method_id || !valor || !artista_id) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.MISSING_DATA }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!payer || !payer.email || !payer.identification || !payer.identification.type || !payer.identification.number) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_PAYER }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!cliente_id && !session_id) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.MISSING_ID }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (session_id && !uuidRegex.test(session_id)) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.MISSING_ID }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: artista, error: artistaError } = await supabase
      .from('profiles')
      .select('nome, id, tipo, plano')
      .eq('id', artista_id)
      .single();

    if (artistaError || !artista || artista.tipo !== 'artista') {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_ARTIST }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { data: credentials } = await supabase
      .from('artist_mercadopago_credentials')
      .select('seller_id, access_token, refresh_token, token_expires_at')
      .eq('artist_id', artista_id)
      .maybeSingle();

    const platformToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!platformToken) {
      console.error('[INTERNAL] Platform token not configured');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.PAYMENT_FAILED }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Check for active subscription with ends_at (paid subscription)
    const { data: activeSubscription } = await supabase
      .from('artist_subscriptions')
      .select('id, ends_at')
      .eq('artista_id', artista_id)
      .eq('status', 'active')
      .maybeSingle();

    // PRO if: profile is pro AND (no subscription required OR has valid subscription OR permanent PRO with null ends_at)
    const isPro = artista.plano === 'pro' && (
      !activeSubscription || // Admin-granted PRO without subscription record
      activeSubscription.ends_at === null || // Admin-granted permanent PRO
      new Date(activeSubscription.ends_at) > new Date() // Active paid subscription
    );
    const taxaPercentual = isPro ? 0 : 0.20;

    const valorBruto = valor;
    const taxaPlataforma = Number((valorBruto * taxaPercentual).toFixed(2));
    const valorLiquidoArtista = Number((valorBruto * (1 - taxaPercentual)).toFixed(2));
    const valorTotal = valorBruto;

    const installmentsNumber =
      typeof installments === 'string' ? parseInt(installments, 10) : installments;

    if (!installmentsNumber || isNaN(installmentsNumber)) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_INSTALLMENTS }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const gorjetaId = crypto.randomUUID();
    const sellerToken = await getValidSellerToken(credentials, artista_id, supabase);
    const useSellerToken = sellerToken && credentials?.seller_id;
    const tokenToUse = useSellerToken ? sellerToken : platformToken;

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

    if (device_id) {
      paymentData.metadata = { device_id };
    }

    if (useSellerToken && taxaPlataforma > 0) {
      paymentData.application_fee = taxaPlataforma;
    }

    const idempotencyKey = crypto.randomUUID();

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
      console.error('[INTERNAL] Payment API error:', response.status);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.PAYMENT_FAILED }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const mpData = await response.json();
    console.log('Payment created:', mpData.id, 'Status:', mpData.status);

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
      console.error('[INTERNAL] Database error:', gorjetaError);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Payment saved successfully');

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
    console.error('[INTERNAL] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
