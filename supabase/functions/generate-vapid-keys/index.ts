import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if keys already exist
    const { data: existing } = await supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["vapid_public_key", "vapid_private_key"]);

    const existingMap = new Map(existing?.map((r) => [r.setting_key, r.setting_value]) || []);

    if (existingMap.has("vapid_public_key") && existingMap.has("vapid_private_key")) {
      return new Response(
        JSON.stringify({ public_key: existingMap.get("vapid_public_key"), already_existed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate ECDSA P-256 key pair
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    // Export public key as raw (uncompressed point, 65 bytes)
    const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const publicKeyBase64Url = arrayBufferToBase64Url(publicKeyRaw);

    // Export private key as JWK then extract 'd' (the private scalar)
    const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

    // Store both in admin_settings
    const now = new Date().toISOString();
    await supabase.from("admin_settings").upsert([
      { setting_key: "vapid_public_key", setting_value: publicKeyBase64Url, updated_at: now },
      { setting_key: "vapid_private_key", setting_value: JSON.stringify(privateKeyJwk), updated_at: now },
    ], { onConflict: "setting_key" });

    return new Response(
      JSON.stringify({ public_key: publicKeyBase64Url, already_existed: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating VAPID keys:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
