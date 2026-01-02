import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ArtistStats {
  pedidos_pendentes: number;
  pedidos_aceitos: number;
  gorjetas_total: number;
  gorjetas_hoje: number;
}

async function fetchArtistStats(artistId: string): Promise<ArtistStats> {
  // Parallel queries for better performance
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: pendentes },
    { count: aceitos },
    { data: totalGorjetas },
    { data: gorjetasHoje },
  ] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .eq("artista_id", artistId)
      .eq("status", "pendente"),
    supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .eq("artista_id", artistId)
      .eq("status", "aceito"),
    supabase
      .from("gorjetas")
      .select("valor_liquido_artista")
      .eq("artista_id", artistId)
      .eq("status_pagamento", "approved"),
    supabase
      .from("gorjetas")
      .select("valor_liquido_artista")
      .eq("artista_id", artistId)
      .eq("status_pagamento", "approved")
      .gte("created_at", today),
  ]);

  const total = totalGorjetas?.reduce((sum, g) => sum + (g.valor_liquido_artista || 0), 0) || 0;
  const totalHoje = gorjetasHoje?.reduce((sum, g) => sum + (g.valor_liquido_artista || 0), 0) || 0;

  return {
    pedidos_pendentes: pendentes || 0,
    pedidos_aceitos: aceitos || 0,
    gorjetas_total: total,
    gorjetas_hoje: totalHoje,
  };
}

export function useArtistStats(artistId: string | null) {
  return useQuery({
    queryKey: ["artist-stats", artistId],
    queryFn: () => fetchArtistStats(artistId!),
    enabled: !!artistId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
