import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Try to get existing public key
    const { data } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "vapid_public_key")
      .maybeSingle();

    if (data?.setting_value) {
      return new Response(
        JSON.stringify({ public_key: data.setting_value }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-generate if not exists
    const generateUrl = `${supabaseUrl}/functions/v1/generate-vapid-keys`;
    const res = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const result = await res.json();

    return new Response(
      JSON.stringify({ public_key: result.public_key }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error getting VAPID public key:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
