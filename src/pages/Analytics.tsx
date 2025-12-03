import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Menu, BarChart3 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import NotificationBell from "@/components/NotificationBell";

interface AnalyticsData {
  pedidosPorDia: { data: string; total: number }[];
  gorjetasPorDia: { data: string; valor: number }[];
  topMusicas: { musica: string; total: number }[];
  taxaAceitacao: number;
  ticketMedio: number;
  totalClientes: number;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [artistName, setArtistName] = useState("");
  const [artistPhoto, setArtistPhoto] = useState<string | undefined>();
  const [ativoAoVivo, setAtivoAoVivo] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    pedidosPorDia: [],
    gorjetasPorDia: [],
    topMusicas: [],
    taxaAceitacao: 0,
    ticketMedio: 0,
    totalClientes: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (artistId) {
      fetchAnalytics();
      setLoading(false);
    }
  }, [artistId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tipo, nome, ativo_ao_vivo, foto_url")
      .eq("id", user.id)
      .single();

    if (!profile || profile.tipo !== "artista") {
      navigate("/home");
      return;
    }

    setArtistId(user.id);
    setArtistName(profile.nome);
    setArtistPhoto(profile.foto_url || undefined);
    setAtivoAoVivo(profile.ativo_ao_vivo || false);
  };

  const fetchAnalytics = async () => {
    if (!artistId) return;

    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    // Pedidos por dia (últimos 7 dias)
    const { data: pedidosData } = await supabase
      .from("pedidos")
      .select("created_at")
      .eq("artista_id", artistId)
      .gte("created_at", seteDiasAtras.toISOString());

    const pedidosPorDia = Array.from({ length: 7 }, (_, i) => {
      const data = new Date();
      data.setDate(data.getDate() - (6 - i));
      const dataStr = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const total = pedidosData?.filter(p => {
        const pedidoData = new Date(p.created_at);
        return pedidoData.toDateString() === data.toDateString();
      }).length || 0;
      return { data: dataStr, total };
    });

    // Gorjetas por dia (últimos 7 dias)
    const { data: gorjetasData } = await supabase
      .from("gorjetas")
      .select("valor_liquido_artista, created_at, status_pagamento")
      .eq("artista_id", artistId)
      .eq("status_pagamento", "approved")
      .gte("created_at", seteDiasAtras.toISOString());

    const gorjetasPorDia = Array.from({ length: 7 }, (_, i) => {
      const data = new Date();
      data.setDate(data.getDate() - (6 - i));
      const dataStr = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const valor = gorjetasData?.filter(g => {
        const gorjetaData = new Date(g.created_at);
        return gorjetaData.toDateString() === data.toDateString();
      }).reduce((sum, g) => sum + (g.valor_liquido_artista || 0), 0) || 0;
      return { data: dataStr, valor };
    });

    // Top 5 músicas mais pedidas
    const { data: todasMusicas } = await supabase
      .from("pedidos")
      .select("musica")
      .eq("artista_id", artistId);

    const musicasCount = todasMusicas?.reduce((acc, p) => {
      acc[p.musica] = (acc[p.musica] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topMusicas = Object.entries(musicasCount)
      .map(([musica, total]) => ({ musica, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Taxa de aceitação
    const { count: totalPedidos } = await supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .eq("artista_id", artistId);

    const { count: pedidosAceitos } = await supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .eq("artista_id", artistId)
      .eq("status", "aceito");

    const taxaAceitacao = totalPedidos && totalPedidos > 0 
      ? (pedidosAceitos || 0) / totalPedidos * 100 
      : 0;

    // Ticket médio de gorjetas
    const { data: todasGorjetas } = await supabase
      .from("gorjetas")
      .select("valor_liquido_artista, status_pagamento")
      .eq("artista_id", artistId)
      .eq("status_pagamento", "approved");

    const ticketMedio = todasGorjetas && todasGorjetas.length > 0
      ? todasGorjetas.reduce((sum, g) => sum + (g.valor_liquido_artista || 0), 0) / todasGorjetas.length
      : 0;

    // Total de clientes únicos
    const { data: clientesUnicos } = await supabase
      .from("pedidos")
      .select("cliente_id")
      .eq("artista_id", artistId);

    const totalClientes = new Set(clientesUnicos?.map(c => c.cliente_id) || []).size;

    setAnalyticsData({
      pedidosPorDia,
      gorjetasPorDia,
      topMusicas,
      taxaAceitacao,
      ticketMedio,
      totalClientes,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-primary/5">
        <AppSidebar 
          artistName={artistName} 
          artistPhoto={artistPhoto}
          ativoAoVivo={ativoAoVivo} 
        />

        <div className="flex-1 flex flex-col">
          <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-40 h-16 flex items-center px-6">
            <SidebarTrigger className="mr-4">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-2 flex-1">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-gradient">Relatórios e Métricas</h1>
            </div>
            <NotificationBell userId={artistId || undefined} />
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Análise de Desempenho</h2>
              <p className="text-muted-foreground">
                Acompanhe suas métricas e tendências dos últimos 7 dias
              </p>
            </div>

            <AnalyticsDashboard data={analyticsData} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;
