import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ActiveCheckin {
  checkin_id: string;
  artista_id: string | null;
  artista_nome: string;
  artista_foto: string | null;
  inicio: string;
}

interface PedidoEstabelecimento {
  id: string;
  estabelecimento_id: string;
  checkin_id: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  session_id: string;
  musica: string;
  mensagem: string | null;
  status: string;
  created_at: string;
  arquivado: boolean;
}

interface Estabelecimento {
  id: string;
  nome: string;
  foto_url: string | null;
  foto_capa_url: string | null;
  cidade: string | null;
  endereco: string | null;
  telefone: string | null;
  tipo_estabelecimento: string | null;
  bio: string | null;
}

export const useEstabelecimento = (estabelecimentoId: string | null) => {
  const [estabelecimento, setEstabelecimento] = useState<Estabelecimento | null>(null);
  const [activeCheckin, setActiveCheckin] = useState<ActiveCheckin | null>(null);
  const [pedidos, setPedidos] = useState<PedidoEstabelecimento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEstabelecimento = useCallback(async () => {
    if (!estabelecimentoId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, foto_url, foto_capa_url, cidade, endereco, telefone, tipo_estabelecimento, bio')
        .eq('id', estabelecimentoId)
        .eq('tipo', 'estabelecimento')
        .single();

      if (error) throw error;
      setEstabelecimento(data);
    } catch (error) {
      console.error('Error fetching estabelecimento:', error);
    }
  }, [estabelecimentoId]);

  const fetchActiveCheckin = useCallback(async () => {
    if (!estabelecimentoId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_estabelecimento_active_checkin', { estab_id: estabelecimentoId });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setActiveCheckin(data[0]);
      } else {
        setActiveCheckin(null);
      }
    } catch (error) {
      console.error('Error fetching active checkin:', error);
    }
  }, [estabelecimentoId]);

  const fetchPedidos = useCallback(async () => {
    if (!estabelecimentoId) return;

    try {
      const { data, error } = await supabase
        .from('pedidos_estabelecimento')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('arquivado', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Error fetching pedidos:', error);
    }
  }, [estabelecimentoId]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchEstabelecimento(), fetchActiveCheckin(), fetchPedidos()]);
    setLoading(false);
  }, [fetchEstabelecimento, fetchActiveCheckin, fetchPedidos]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Subscribe to realtime updates for pedidos
  useEffect(() => {
    if (!estabelecimentoId) return;

    const channel = supabase
      .channel(`pedidos_estabelecimento_${estabelecimentoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos_estabelecimento',
          filter: `estabelecimento_id=eq.${estabelecimentoId}`,
        },
        () => {
          fetchPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [estabelecimentoId, fetchPedidos]);

  // Subscribe to realtime updates for checkins
  useEffect(() => {
    if (!estabelecimentoId) return;

    const channel = supabase
      .channel(`checkins_estabelecimento_${estabelecimentoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estabelecimento_checkins',
          filter: `estabelecimento_id=eq.${estabelecimentoId}`,
        },
        () => {
          fetchActiveCheckin();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [estabelecimentoId, fetchActiveCheckin]);

  return {
    estabelecimento,
    activeCheckin,
    pedidos,
    loading,
    refetch,
  };
};

export const useArtistCheckin = (artistaId: string | null) => {
  const [activeCheckin, setActiveCheckin] = useState<{
    checkin_id: string;
    estabelecimento_id: string;
    estabelecimento_nome: string;
    inicio: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveCheckin = useCallback(async () => {
    if (!artistaId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_artist_active_checkin', { artist_id: artistaId });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setActiveCheckin(data[0]);
      } else {
        setActiveCheckin(null);
      }
    } catch (error) {
      console.error('Error fetching artist active checkin:', error);
    } finally {
      setLoading(false);
    }
  }, [artistaId]);

  const doCheckin = async (estabelecimentoId: string) => {
    if (!artistaId) return { error: 'Artista não identificado' };

    try {
      // First, end any existing active checkin
      if (activeCheckin) {
        await supabase
          .from('estabelecimento_checkins')
          .update({ ativo: false, fim: new Date().toISOString() })
          .eq('id', activeCheckin.checkin_id);
      }

      // Create new checkin
      const { data, error } = await supabase
        .from('estabelecimento_checkins')
        .insert({
          artista_id: artistaId,
          estabelecimento_id: estabelecimentoId,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchActiveCheckin();
      return { data };
    } catch (error: any) {
      console.error('Error doing checkin:', error);
      return { error: error.message };
    }
  };

  const doCheckout = async () => {
    if (!activeCheckin) return { error: 'Nenhum check-in ativo' };

    try {
      const { error } = await supabase
        .from('estabelecimento_checkins')
        .update({ ativo: false, fim: new Date().toISOString() })
        .eq('id', activeCheckin.checkin_id);

      if (error) throw error;

      setActiveCheckin(null);
      return { success: true };
    } catch (error: any) {
      console.error('Error doing checkout:', error);
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchActiveCheckin();
  }, [fetchActiveCheckin]);

  return {
    activeCheckin,
    loading,
    doCheckin,
    doCheckout,
    refetch: fetchActiveCheckin,
  };
};

// Hook para artista buscar pedidos do estabelecimento onde está com check-in ativo
export const useArtistEstabelecimentoPedidos = (checkinId: string | null) => {
  const [pedidos, setPedidos] = useState<PedidoEstabelecimento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = useCallback(async () => {
    if (!checkinId) {
      setPedidos([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pedidos_estabelecimento')
        .select('*')
        .eq('checkin_id', checkinId)
        .eq('arquivado', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Error fetching estabelecimento pedidos:', error);
    } finally {
      setLoading(false);
    }
  }, [checkinId]);

  const updatePedidoStatus = async (pedidoId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('pedidos_estabelecimento')
        .update({ status })
        .eq('id', pedidoId);

      if (error) throw error;
      
      // Update local state
      setPedidos(prev => prev.map(p => 
        p.id === pedidoId ? { ...p, status } : p
      ));
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating pedido status:', error);
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!checkinId) return;

    const channel = supabase
      .channel(`pedidos_artista_${checkinId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos_estabelecimento',
          filter: `checkin_id=eq.${checkinId}`,
        },
        () => {
          fetchPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkinId, fetchPedidos]);

  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente');
  const pedidosAceitos = pedidos.filter(p => p.status === 'aceito');
  const pedidosConcluidos = pedidos.filter(p => p.status === 'concluido');

  return {
    pedidos,
    pedidosPendentes,
    pedidosAceitos,
    pedidosConcluidos,
    loading,
    updatePedidoStatus,
    refetch: fetchPedidos,
  };
};
