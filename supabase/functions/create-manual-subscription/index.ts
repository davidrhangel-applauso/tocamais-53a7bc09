import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { artista_id } = await req.json();

    console.log('Creating manual subscription for artist:', artista_id);

    // Validate artista_id
    if (!artista_id) {
      return new Response(
        JSON.stringify({ error: 'ID do artista não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if artist exists
    const { data: artist, error: artistError } = await supabase
      .from('profiles')
      .select('id, nome, tipo')
      .eq('id', artista_id)
      .single();

    if (artistError || !artist) {
      console.error('Artist not found:', artistError);
      return new Response(
        JSON.stringify({ error: 'Artista não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (artist.tipo !== 'artista') {
      return new Response(
        JSON.stringify({ error: 'Usuário não é um artista' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing active or pending subscription
    const { data: existingSubscription } = await supabase
      .from('artist_subscriptions')
      .select('id, status')
      .eq('artista_id', artista_id)
      .in('status', ['active', 'pending_payment'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSubscription?.status === 'active') {
      return new Response(
        JSON.stringify({ error: 'Você já possui uma assinatura ativa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get admin settings for PIX
    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value');

    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar configurações de pagamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse settings
    const adminSettings: Record<string, string> = {};
    settings?.forEach(s => {
      adminSettings[s.setting_key] = s.setting_value;
    });

    const pixKey = adminSettings['subscription_pix_key'];
    const pixKeyType = adminSettings['subscription_pix_key_type'] || 'cpf';
    const pixName = adminSettings['subscription_pix_name'] || 'TocaMais';
    const pixCity = adminSettings['subscription_pix_city'] || 'São Paulo';
    const price = parseFloat(adminSettings['subscription_price'] || '19.90');

    if (!pixKey) {
      return new Response(
        JSON.stringify({ error: 'Chave PIX do administrador não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create subscription record with pending_payment status
    let subscriptionId = existingSubscription?.id;
    
    if (!subscriptionId) {
      const { data: newSubscription, error: subError } = await supabase
        .from('artist_subscriptions')
        .insert({
          artista_id,
          status: 'pending_payment',
          valor: price,
        })
        .select('id')
        .single();

      if (subError) {
        console.error('Error creating subscription:', subError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar assinatura' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      subscriptionId = newSubscription.id;
    }

    // Generate PIX code using EMV format
    function generatePixCode(
      key: string,
      name: string,
      city: string,
      amount: number,
      txid: string
    ): string {
      const formatField = (id: string, value: string) => {
        const len = value.length.toString().padStart(2, '0');
        return `${id}${len}${value}`;
      };

      // Payload Format Indicator
      let pix = formatField('00', '01');
      
      // Merchant Account Information (PIX)
      const gui = formatField('00', 'BR.GOV.BCB.PIX');
      const chave = formatField('01', key);
      pix += formatField('26', gui + chave);
      
      // Merchant Category Code
      pix += formatField('52', '0000');
      
      // Transaction Currency (986 = BRL)
      pix += formatField('53', '986');
      
      // Transaction Amount
      pix += formatField('54', amount.toFixed(2));
      
      // Country Code
      pix += formatField('58', 'BR');
      
      // Merchant Name (max 25 chars)
      pix += formatField('59', name.substring(0, 25).toUpperCase());
      
      // Merchant City (max 15 chars)
      pix += formatField('60', city.substring(0, 15).toUpperCase());
      
      // Additional Data Field (TXID)
      const txidField = formatField('05', txid.substring(0, 25));
      pix += formatField('62', txidField);
      
      // CRC16 placeholder
      pix += '6304';
      
      // Calculate CRC16-CCITT
      const crc = calculateCRC16(pix);
      pix = pix.slice(0, -4) + '6304' + crc;
      
      return pix;
    }

    function calculateCRC16(str: string): string {
      let crc = 0xFFFF;
      for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if (crc & 0x8000) {
            crc = (crc << 1) ^ 0x1021;
          } else {
            crc <<= 1;
          }
        }
        crc &= 0xFFFF;
      }
      return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    // Generate unique TXID
    const txid = `TOCA${subscriptionId.replace(/-/g, '').substring(0, 21)}`;
    const pixCode = generatePixCode(pixKey, pixName, pixCity, price, txid);

    console.log('Manual subscription created successfully:', subscriptionId);

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscriptionId,
        pix_code: pixCode,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        pix_name: pixName,
        pix_city: pixCity,
        price: price,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in create-manual-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});