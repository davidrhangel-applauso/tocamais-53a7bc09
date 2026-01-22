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
  artista_id: string;
  session_id: string | null;
  arquivado: boolean;
  arquivado_at: string | null;
  profiles: {
    nome: string;
    foto_url: string | null;
  } | null;
}

async function fetchPedidos(artistId: string, includeArchived = false): Promise<Pedido[]> {
  // Use PostgREST join to avoid N+1 queries
  let query = supabase
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
      artista_id,
      session_id,
      arquivado,
      arquivado_at,
      profiles:cliente_id (nome, foto_url)
    `)
    .eq("artista_id", artistId);

  if (!includeArchived) {
    query = query.eq("arquivado", false);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((pedido: any) => ({
    ...pedido,
    artista_id: pedido.artista_id,
    session_id: pedido.session_id,
    arquivado: pedido.arquivado ?? false,
    arquivado_at: pedido.arquivado_at,
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

export function useConfirmPixPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedido }: { pedido: Pedido }) => {
      // Debug: log the pedido being confirmed
      console.log("[useConfirmPixPayment] Confirming PIX for pedido:", {
        id: pedido.id,
        musica: pedido.musica,
        valor: pedido.valor,
        valorType: typeof pedido.valor,
        status: pedido.status,
        artista_id: pedido.artista_id,
      });

      // Fetch fresh data from DB to ensure we have the latest valor
      const { data: freshPedido, error: fetchError } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", pedido.id)
        .single();

      if (fetchError) {
        console.error("[useConfirmPixPayment] Error fetching fresh pedido:", fetchError);
        throw fetchError;
      }

      console.log("[useConfirmPixPayment] Fresh pedido from DB:", {
        id: freshPedido.id,
        valor: freshPedido.valor,
        valorType: typeof freshPedido.valor,
        status: freshPedido.status,
      });

      const valorToUse = freshPedido.valor ?? pedido.valor;
      
      if (!valorToUse || valorToUse <= 0) {
        console.error("[useConfirmPixPayment] Invalid valor:", valorToUse);
        throw new Error("Valor inválido ou não encontrado. Verifique se o cliente informou o valor do PIX.");
      }

      console.log("[useConfirmPixPayment] Creating gorjeta with valor:", valorToUse);

      // 1. Create gorjeta with status approved (PRO artists: 0% fee)
      const { error: gorjetaError } = await supabase
        .from("gorjetas")
        .insert({
          artista_id: freshPedido.artista_id,
          cliente_id: freshPedido.cliente_id,
          cliente_nome: freshPedido.cliente_nome,
          session_id: freshPedido.session_id,
          valor: valorToUse,
          valor_liquido_artista: valorToUse, // 100% for PRO artists
          taxa_plataforma: 0, // PRO artists don't pay platform fee
          status_pagamento: 'approved',
          pedido_musica: freshPedido.musica,
          pedido_mensagem: freshPedido.mensagem,
        });

      if (gorjetaError) {
        console.error("[useConfirmPixPayment] Error creating gorjeta:", gorjetaError);
        throw gorjetaError;
      }

      console.log("[useConfirmPixPayment] Gorjeta created successfully");

      // 2. Update pedido status to pendente
      const { error: pedidoError } = await supabase
        .from("pedidos")
        .update({ status: 'pendente' })
        .eq("id", pedido.id);

      if (pedidoError) {
        console.error("[useConfirmPixPayment] Error updating pedido:", pedidoError);
        throw pedidoError;
      }

      console.log("[useConfirmPixPayment] Pedido updated to pendente");
    },
    onSuccess: () => {
      toast.success("PIX confirmado! Gorjeta registrada ✅");
    },
    onError: (error: any) => {
      console.error("[useConfirmPixPayment] Mutation error:", error);
      toast.error(`Erro ao confirmar PIX: ${error.message ?? "tente novamente"}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-gorjetas"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    },
  });
}

export function useArchiveOldPedidos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      artistId, 
      olderThanDays, 
      statuses 
    }: { 
      artistId: string; 
      olderThanDays: number;
      statuses: string[];
    }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from("pedidos")
        .update({ 
          arquivado: true, 
          arquivado_at: new Date().toISOString() 
        })
        .eq("artista_id", artistId)
        .eq("arquivado", false)
        .in("status", statuses)
        .lt("created_at", cutoffDate.toISOString())
        .select("id");

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (count) => {
      if (count > 0) {
        toast.success(`${count} pedido(s) arquivado(s) 📦`);
      } else {
        toast.info("Nenhum pedido encontrado para arquivar");
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao arquivar pedidos: ${error.message ?? "tente novamente"}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-archived-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    },
  });
}

export function useRestorePedidos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedidoIds }: { pedidoIds: string[] }) => {
      const { error } = await supabase
        .from("pedidos")
        .update({ 
          arquivado: false, 
          arquivado_at: null 
        })
        .in("id", pedidoIds);

      if (error) throw error;
      return pedidoIds.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} pedido(s) restaurado(s) ✅`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao restaurar pedidos: ${error.message ?? "tente novamente"}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-archived-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    },
  });
}

export function useArchivedPedidos(artistId: string | null) {
  return useQuery({
    queryKey: ["artist-archived-pedidos", artistId],
    queryFn: async () => {
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
          artista_id,
          session_id,
          arquivado,
          arquivado_at,
          profiles:cliente_id (nome, foto_url)
        `)
        .eq("artista_id", artistId!)
        .eq("arquivado", true)
        .order("arquivado_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((pedido: any) => ({
        ...pedido,
        profiles: pedido.profiles || null,
      })) as Pedido[];
    },
    enabled: !!artistId,
    staleTime: 30000,
  });
}

export function useBulkArchivePedidos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedidoIds }: { pedidoIds: string[] }) => {
      const { error } = await supabase
        .from("pedidos")
        .update({ 
          arquivado: true, 
          arquivado_at: new Date().toISOString() 
        })
        .in("id", pedidoIds);

      if (error) throw error;
      return pedidoIds.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} pedido(s) arquivado(s) 📦`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao arquivar pedidos: ${error.message ?? "tente novamente"}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-archived-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    },
  });
}

export function useDeletePedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedidoId }: { pedidoId: string }) => {
      // Delete only the pedido, gorjetas are NOT affected
      const { error } = await supabase
        .from("pedidos")
        .delete()
        .eq("id", pedidoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido excluído 🗑️");
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir pedido: ${error.message ?? "tente novamente"}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-archived-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    },
  });
}

export function useArchivePedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedidoId }: { pedidoId: string }) => {
      const { error } = await supabase
        .from("pedidos")
        .update({ 
          arquivado: true, 
          arquivado_at: new Date().toISOString() 
        })
        .eq("id", pedidoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido arquivado 📦");
    },
    onError: (error: any) => {
      toast.error(`Erro ao arquivar pedido: ${error.message ?? "tente novamente"}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-archived-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    },
  });
}
