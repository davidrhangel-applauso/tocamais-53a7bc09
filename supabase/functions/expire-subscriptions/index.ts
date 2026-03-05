import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find expired subscriptions
    const { data: expired, error } = await supabase
      .from('artist_subscriptions')
      .select('id, artista_id, ends_at')
      .eq('status', 'active')
      .not('ends_at', 'is', null)
      .lt('ends_at', new Date().toISOString());

    if (error) throw error;

    let expiredCount = 0;

    for (const sub of expired || []) {
      // Update subscription status
      await supabase
        .from('artist_subscriptions')
        .update({ status: 'expired' })
        .eq('id', sub.id);

      // Check if artist has another active subscription
      const { data: otherActive } = await supabase
        .from('artist_subscriptions')
        .select('id')
        .eq('artista_id', sub.artista_id)
        .eq('status', 'active')
        .neq('id', sub.id)
        .limit(1);

      if (!otherActive || otherActive.length === 0) {
        // Downgrade to free
        await supabase
          .from('profiles')
          .update({ plano: 'free' })
          .eq('id', sub.artista_id);

        // Notify artist
        await supabase.rpc('criar_notificacao', {
          p_usuario_id: sub.artista_id,
          p_tipo: 'assinatura_expirada',
          p_titulo: 'Assinatura Expirada',
          p_mensagem: 'Sua assinatura PRO expirou. Renove para continuar aproveitando todos os benefícios!',
          p_link: '/pro',
        });
      }

      expiredCount++;
    }

    console.log(`Expired ${expiredCount} subscriptions`);

    return new Response(
      JSON.stringify({ success: true, expired_count: expiredCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error expiring subscriptions:', error);
    const msg = error instanceof Error ? error.message : 'Internal error';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
