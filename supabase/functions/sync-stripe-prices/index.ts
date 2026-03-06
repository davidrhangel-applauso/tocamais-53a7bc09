import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Product IDs from Stripe (fixed mapping)
const PRODUCT_IDS: Record<string, string> = {
  mensal: "prod_U42eL1QKCGCAhA",
  anual: "prod_U42etWsokczgbV",
  bienal: "prod_U42fQZq7HWzqlV",
};

// Recurring intervals per plan
const PLAN_INTERVALS: Record<string, { interval: string; interval_count?: number }> = {
  mensal: { interval: "month" },
  anual: { interval: "year" },
  bienal: { interval: "year", interval_count: 2 },
};

// Default price IDs (fallback)
const DEFAULT_PRICE_IDS: Record<string, string> = {
  mensal: "price_1T5uYrK9iScCpCyIPO1vAvXp",
  anual: "price_1T5uZNK9iScCpCyI3V89oboN",
  bienal: "price_1T5ua3K9iScCpCyIjE7vp6yU",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // 2. Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // 3. Parse request
    const { plan_key, price } = await req.json();
    if (!plan_key || !PRODUCT_IDS[plan_key]) {
      throw new Error(`Invalid plan_key: ${plan_key}`);
    }
    if (!price || price <= 0) {
      throw new Error("Price must be positive");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const productId = PRODUCT_IDS[plan_key];
    const interval = PLAN_INTERVALS[plan_key];
    const unitAmount = Math.round(price * 100); // Convert to centavos

    // 4. Create new Price in Stripe
    const newPrice = await stripe.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency: "brl",
      recurring: interval as any,
    });

    console.log(`[SYNC-STRIPE-PRICES] Created new price ${newPrice.id} for ${plan_key} at ${unitAmount} centavos`);

    // 5. Deactivate old price (if exists in admin_settings)
    const settingKey = `stripe_price_id_${plan_key}`;
    const { data: existingSetting } = await supabaseAdmin
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", settingKey)
      .maybeSingle();

    const oldPriceId = existingSetting?.setting_value || DEFAULT_PRICE_IDS[plan_key];
    if (oldPriceId && oldPriceId !== newPrice.id) {
      try {
        await stripe.prices.update(oldPriceId, { active: false });
        console.log(`[SYNC-STRIPE-PRICES] Deactivated old price ${oldPriceId}`);
      } catch (e) {
        console.warn(`[SYNC-STRIPE-PRICES] Could not deactivate old price ${oldPriceId}:`, e);
      }
    }

    // 6. Save new price_id in admin_settings
    const { error: upsertError } = await supabaseAdmin
      .from("admin_settings")
      .upsert(
        { setting_key: settingKey, setting_value: newPrice.id, updated_at: new Date().toISOString() },
        { onConflict: "setting_key" }
      );

    if (upsertError) throw upsertError;

    console.log(`[SYNC-STRIPE-PRICES] Saved ${settingKey} = ${newPrice.id}`);

    return new Response(
      JSON.stringify({ success: true, price_id: newPrice.id, plan_key }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[SYNC-STRIPE-PRICES] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
