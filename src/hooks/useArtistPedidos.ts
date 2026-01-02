import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface Pedido {
  id: string;
  musica: string;
  mensagem: string | null;
  status: string;
  created_at: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  valor: number | null;
  profiles: {
    nome: string;
    foto_url: string | null;
  } | null;
}

async function fetchPedidos(artistId: string): Promise<Pedido[]> {
  // Use PostgREST join to avoid N+1 queries
  const { data, error } = await supabase
    .from("pedidos")
    .select(`
      id,
      musica,
      mensagem,
      status,
      created_at,
      cliente_id,
      cliente_nome,
      valor,
      profiles:cliente_id (nome, foto_url)
    `)
    .eq("artista_id", artistId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((pedido: any) => ({
    ...pedido,
    profiles: pedido.profiles || null,
  }));
}

export function useArtistPedidos(artistId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["artist-pedidos", artistId],
    queryFn: () => fetchPedidos(artistId!),
    enabled: !!artistId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!artistId) return;

    const channel = supabase
      .channel(`pedidos-${artistId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `artista_id=eq.${artistId}`,
        },
        (payload) => {
          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["artist-pedidos", artistId] });
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

export function useUpdatePedidoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedidoId, status }: { pedidoId: string; status: string }) => {
      const { error } = await supabase
        .from("pedidos")
        .update({ status })
        .eq("id", pedidoId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(
        status === "aceito" 
          ? "Pedido aceito! ✅" 
          : status === "concluido"
          ? "Pedido marcado como concluído! 🎵"
          : "Pedido recusado"
      );
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar pedido: ${error.message ?? "tente novamente"}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    },
  });
}

export function useBulkUpdatePedidos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedidoIds, status }: { pedidoIds: string[]; status: string }) => {
      const { error } = await supabase
        .from("pedidos")
        .update({ status })
        .in("id", pedidoIds);

      if (error) throw error;
      return pedidoIds.length;
    },
    onSuccess: (count, { status }) => {
      toast.success(
        `${count} pedido(s) ${status === "aceito" ? "aceito(s)" : "recusado(s)"}`
      );
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar pedidos: ${error.message ?? "tente novamente"}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    },
  });
}
