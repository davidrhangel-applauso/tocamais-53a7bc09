import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function textEncode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

async function createVapidAuthHeader(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKeyJwk: JsonWebKey
): Promise<{ authorization: string; cryptoKey: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    vapidPrivateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Create JWT header and payload
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: "mailto:contato@tocamais.app",
  };

  const headerB64 = arrayBufferToBase64Url(textEncode(JSON.stringify(header)).buffer);
  const payloadB64 = arrayBufferToBase64Url(textEncode(JSON.stringify(payload)).buffer);
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Sign with ECDSA
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    textEncode(unsignedToken)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  } else {
    // DER format parsing
    let offset = 2;
    const rLen = sigBytes[offset + 1];
    offset += 2;
    const rRaw = sigBytes.slice(offset, offset + rLen);
    r = rRaw.length > 32 ? rRaw.slice(rRaw.length - 32) : rRaw;
    offset += rLen;
    const sLen = sigBytes[offset + 1];
    offset += 2;
    const sRaw = sigBytes.slice(offset, offset + sLen);
    s = sRaw.length > 32 ? sRaw.slice(sRaw.length - 32) : sRaw;
  }

  // Pad to 32 bytes each
  const rPadded = new Uint8Array(32);
  rPadded.set(r, 32 - r.length);
  const sPadded = new Uint8Array(32);
  sPadded.set(s, 32 - s.length);

  const rawSig = new Uint8Array(64);
  rawSig.set(rPadded, 0);
  rawSig.set(sPadded, 32);

  const jwt = `${unsignedToken}.${arrayBufferToBase64Url(rawSig.buffer)}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: `p256ecdsa=${vapidPublicKey}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, link, notification_id } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get VAPID keys
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["vapid_public_key", "vapid_private_key"]);

    const settingsMap = new Map(settings?.map((r) => [r.setting_key, r.setting_value]) || []);
    const vapidPublicKey = settingsMap.get("vapid_public_key");
    const vapidPrivateKeyStr = settingsMap.get("vapid_private_key");

    if (!vapidPublicKey || !vapidPrivateKeyStr) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vapidPrivateKeyJwk = JSON.parse(vapidPrivateKeyStr);

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No push subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/favicon.png",
      badge: "/favicon.png",
      data: { link: link || "/painel", notification_id },
    });

    let sent = 0;
    const expiredIds: string[] = [];

    for (const sub of subscriptions) {
      try {
        const vapidHeaders = await createVapidAuthHeader(
          sub.endpoint,
          vapidPublicKey,
          vapidPrivateKeyJwk
        );

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            TTL: "86400",
            Urgency: "high",
            Authorization: vapidHeaders.authorization,
            "Crypto-Key": vapidHeaders.cryptoKey,
          },
          body: payload,
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired or invalid
          expiredIds.push(sub.id);
        } else {
          console.error(`Push failed for ${sub.endpoint}: ${response.status} ${await response.text()}`);
        }
      } catch (err) {
        console.error(`Error sending to ${sub.endpoint}:`, err);
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expiredIds);
    }

    return new Response(
      JSON.stringify({ sent, expired_removed: expiredIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
