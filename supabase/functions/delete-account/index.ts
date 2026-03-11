import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    
    // Use service role to delete all user data
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete in order (respecting foreign keys)
    await adminClient.from("setlist_musicas").delete().in("setlist_id",
      (await adminClient.from("setlists").select("id").eq("artista_id", userId)).data?.map(s => s.id) || []
    );
    await adminClient.from("setlists").delete().eq("artista_id", userId);
    await adminClient.from("musicas_repertorio").delete().eq("artista_id", userId);
    await adminClient.from("subscription_receipts").delete().eq("artista_id", userId);
    await adminClient.from("artist_subscriptions").delete().eq("artista_id", userId);
    await adminClient.from("artist_pix_info").delete().eq("artist_id", userId);
    await adminClient.from("avaliacoes_artistas").delete().or(`artista_id.eq.${userId},cliente_id.eq.${userId}`);
    await adminClient.from("estabelecimento_checkins").delete().or(`artista_id.eq.${userId},estabelecimento_id.eq.${userId}`);
    await adminClient.from("pedidos_estabelecimento").delete().or(`estabelecimento_id.eq.${userId},cliente_id.eq.${userId}`);
    await adminClient.from("gorjetas").delete().or(`artista_id.eq.${userId},cliente_id.eq.${userId}`);
    await adminClient.from("pedidos").delete().or(`artista_id.eq.${userId},cliente_id.eq.${userId}`);
    await adminClient.from("mensagens").delete().or(`remetente_id.eq.${userId},destinatario_id.eq.${userId}`);
    await adminClient.from("notificacoes").delete().eq("usuario_id", userId);
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("id", userId);

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Erro ao excluir conta de autenticação" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
