import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const FREE_TIP_LIMIT = 10;

export function useFreeTipLimit(artistId: string | null, isPro: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ["free-tip-limit", artistId],
    queryFn: async () => {
      if (!artistId) return 0;
      const { data, error } = await supabase
        .rpc("get_artist_approved_total", { artist_id: artistId });
      if (error) throw error;
      return Number(data) || 0;
    },
    enabled: !!artistId && !isPro,
    refetchInterval: 30000,
  });

  const totalReceived = data ?? 0;
  const limitReached = !isPro && totalReceived >= FREE_TIP_LIMIT;
  const remainingAmount = Math.max(0, FREE_TIP_LIMIT - totalReceived);
  const progressPercent = Math.min(100, (totalReceived / FREE_TIP_LIMIT) * 100);

  return {
    totalReceived,
    limitReached,
    remainingAmount,
    progressPercent,
    isLoading,
  };
}
