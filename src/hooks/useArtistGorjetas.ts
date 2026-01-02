import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface Gorjeta {
  id: string;
  valor: number;
  valor_liquido_artista: number;
  taxa_plataforma: number;
  created_at: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  status_pagamento: string;
  pedido_musica: string | null;
  pedido_mensagem: string | null;
  profiles: {
    nome: string;
    foto_url: string | null;
  } | null;
}

async function fetchGorjetas(artistId: string): Promise<Gorjeta[]> {
  // Use PostgREST join to avoid N+1 queries
  const { data, error } = await supabase
    .from("gorjetas")
    .select(`
      id,
      valor,
      valor_liquido_artista,
      taxa_plataforma,
      created_at,
      cliente_id,
      cliente_nome,
      status_pagamento,
      pedido_musica,
      pedido_mensagem,
      profiles:cliente_id (nome, foto_url)
    `)
    .eq("artista_id", artistId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((gorjeta: any) => ({
    ...gorjeta,
    profiles: gorjeta.profiles || null,
  }));
}

export function useArtistGorjetas(artistId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["artist-gorjetas", artistId],
    queryFn: () => fetchGorjetas(artistId!),
    enabled: !!artistId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!artistId) return;

    const channel = supabase
      .channel(`gorjetas-${artistId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gorjetas",
          filter: `artista_id=eq.${artistId}`,
        },
        () => {
          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["artist-gorjetas", artistId] });
          queryClient.invalidateQueries({ queryKey: ["artist-stats", artistId] });
          toast.success("Nova gorjeta recebida! 🎉");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "gorjetas",
          filter: `artista_id=eq.${artistId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["artist-gorjetas", artistId] });
          queryClient.invalidateQueries({ queryKey: ["artist-stats", artistId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId, queryClient]);

  return query;
}
