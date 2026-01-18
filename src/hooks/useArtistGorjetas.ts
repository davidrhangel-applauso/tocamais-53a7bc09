import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
  arquivado?: boolean;
  arquivado_at?: string | null;
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
      arquivado,
      arquivado_at,
      profiles:cliente_id (nome, foto_url)
    `)
    .eq("artista_id", artistId)
    .eq("arquivado", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((gorjeta: any) => ({
    ...gorjeta,
    profiles: gorjeta.profiles || null,
  }));
}

async function fetchArchivedGorjetas(artistId: string): Promise<Gorjeta[]> {
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
      arquivado,
      arquivado_at,
      profiles:cliente_id (nome, foto_url)
    `)
    .eq("artista_id", artistId)
    .eq("arquivado", true)
    .order("arquivado_at", { ascending: false })
    .limit(100);

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

export function useArchivedGorjetas(artistId: string | null) {
  return useQuery({
    queryKey: ["archived-gorjetas", artistId],
    queryFn: () => fetchArchivedGorjetas(artistId!),
    enabled: !!artistId,
    staleTime: 60000,
  });
}

export function useArchiveOldGorjetas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      artistId,
      olderThanDays,
      statuses,
    }: {
      artistId: string;
      olderThanDays: number;
      statuses: string[];
    }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabase
        .from("gorjetas")
        .update({
          arquivado: true,
          arquivado_at: new Date().toISOString(),
        })
        .eq("artista_id", artistId)
        .eq("arquivado", false)
        .in("status_pagamento", statuses)
        .lt("created_at", cutoffDate.toISOString());

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["artist-gorjetas", variables.artistId] });
      queryClient.invalidateQueries({ queryKey: ["archived-gorjetas", variables.artistId] });
      toast.success("Gorjetas arquivadas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao arquivar gorjetas");
    },
  });
}

export function useRestoreGorjetas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gorjetaIds }: { gorjetaIds: string[] }) => {
      const { error } = await supabase
        .from("gorjetas")
        .update({
          arquivado: false,
          arquivado_at: null,
        })
        .in("id", gorjetaIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-gorjetas"] });
      queryClient.invalidateQueries({ queryKey: ["archived-gorjetas"] });
      toast.success("Gorjetas restauradas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao restaurar gorjetas");
    },
  });
}
