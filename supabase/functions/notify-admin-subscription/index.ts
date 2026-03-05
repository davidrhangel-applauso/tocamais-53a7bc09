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

    const { artista_id, plan_name } = await req.json();

    // Get artist name
    const { data: artist } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', artista_id)
      .single();

    // Get all admin user IDs
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await supabase.rpc('criar_notificacao', {
          p_usuario_id: admin.user_id,
          p_tipo: 'nova_assinatura_pix',
          p_titulo: 'Nova Assinatura PIX! 💰',
          p_mensagem: `${artist?.nome || 'Artista'} enviou um comprovante de pagamento PIX para o plano ${plan_name || 'PRO'}. Verifique e aprove.`,
          p_link: '/admin?tab=assinaturas',
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error notifying admin:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
