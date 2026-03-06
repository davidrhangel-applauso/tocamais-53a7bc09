import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS } from "@/lib/stripe-plans";

export interface AdminPrices {
  mensal: number;
  anual: number;
  bienal: number;
  mensalMonthly: number;
  anualMonthly: number;
  bienalMonthly: number;
  anualSavings: number;
  bienalSavings: number;
  anualSavingsText: string;
  bienalSavingsText: string;
  isLoading: boolean;
}

const DEFAULT_PRICES = {
  mensal: STRIPE_PLANS.mensal.price,
  anual: STRIPE_PLANS.anual.price,
  bienal: STRIPE_PLANS.bienal.price,
};

export function useAdminPrices(): AdminPrices {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .like("setting_key", "subscription_price_%");

      if (error) {
        console.error("Error fetching admin prices:", error);
        return DEFAULT_PRICES;
      }

      const prices = { ...DEFAULT_PRICES };
      for (const row of data || []) {
        const planKey = row.setting_key.replace("subscription_price_", "") as keyof typeof prices;
        if (planKey in prices) {
          const parsed = parseFloat(row.setting_value);
          if (!isNaN(parsed) && parsed > 0) {
            prices[planKey] = parsed;
          }
        }
      }
      return prices;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const mensal = data?.mensal ?? DEFAULT_PRICES.mensal;
  const anual = data?.anual ?? DEFAULT_PRICES.anual;
  const bienal = data?.bienal ?? DEFAULT_PRICES.bienal;

  const mensalMonthly = mensal;
  const anualMonthly = parseFloat((anual / 12).toFixed(2));
  const bienalMonthly = parseFloat((bienal / 24).toFixed(2));

  const anualSavings = parseFloat((mensal * 12 - anual).toFixed(2));
  const bienalSavings = parseFloat((mensal * 24 - bienal).toFixed(2));

  const formatCurrency = (v: number) =>
    `R$ ${v.toFixed(2).replace(".", ",")}`;

  return {
    mensal,
    anual,
    bienal,
    mensalMonthly,
    anualMonthly,
    bienalMonthly,
    anualSavings,
    bienalSavings,
    anualSavingsText: anualSavings > 0 ? `Economize ${formatCurrency(anualSavings)}` : "",
    bienalSavingsText: bienalSavings > 0 ? `Economize ${formatCurrency(bienalSavings)}` : "",
    isLoading,
  };
}

/** Format a price number as "19,90" */
export function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",");
}
