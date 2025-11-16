import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Heart, LogOut, Settings, TrendingUp, Check, X, MessageCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

interface Pedido {
  id: string;
  musica: string;
  mensagem: string | null;
  status: string;
  created_at: string;
  cliente_id: string;
  profiles: {
    nome: string;
    foto_url: string;
  };
}

interface Gorjeta {
  id: string;
  valor: number;
  created_at: string;
  cliente_id: string;
  profiles: {
    nome: string;
    foto_url: string;
  };
}

interface Stats {
  pedidos_pendentes: number;
  pedidos_aceitos: number;
  gorjetas_total: number;
  gorjetas_hoje: number;
}

interface AnalyticsData {
  pedidosPorDia: { data: string; total: number }[];
  gorjetasPorDia: { data: string; valor: number }[];
  topMusicas: { musica: string; total: number }[];
  taxaAceitacao: number;
  ticketMedio: number;
  totalClientes: number;
}

const ArtistPanel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [artistName, setArtistName] = useState("");
  const [ativoAoVivo, setAtivoAoVivo] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [gorjetas, setGorjetas] = useState<Gorjeta[]>([]);
  const [stats, setStats] = useState<Stats>({
    pedidos_pendentes: 0,
    pedidos_aceitos: 0,
    gorjetas_total: 0,
    gorjetas_hoje: 0,
  });
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
      fetchData();
      
      // Subscribe to realtime updates
      const pedidosChannel = supabase
        .channel('pedidos-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pedidos',
            filter: `artista_id=eq.${artistId}`
          },
          () => {
            fetchPedidos();
            fetchStats();
            fetchAnalytics();
          }
        )
        .subscribe();

      const gorjetasChannel = supabase
        .channel('gorjetas-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'gorjetas',
            filter: `artista_id=eq.${artistId}`
          },
          () => {
            fetchGorjetas();
            fetchStats();
            fetchAnalytics();
            toast.success("Nova gorjeta recebida! 🎉");
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(pedidosChannel);
        supabase.removeChannel(gorjetasChannel);
      };
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
      .select("tipo, nome, ativo_ao_vivo")
      .eq("id", user.id)
      .single();

    if (!profile || profile.tipo !== "artista") {
      navigate("/home");
      return;
    }

    setArtistId(user.id);
    setArtistName(profile.nome);
    setAtivoAoVivo(profile.ativo_ao_vivo || false);
  };

  const fetchData = () => {
    fetchPedidos();
    fetchGorjetas();
    fetchStats();
    fetchAnalytics();
    setLoading(false);
  };

  const fetchPedidos = async () => {
    if (!artistId) return;

    const { data, error } = await supabase
      .from("pedidos")
      .select(`
        *,
        profiles!pedidos_cliente_id_fkey (nome, foto_url)
      `)
      .eq("artista_id", artistId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos");
      return;
    }

    setPedidos(data || []);
  };

  const fetchGorjetas = async () => {
    if (!artistId) return;

    const { data, error } = await supabase
      .from("gorjetas")
      .select(`
        *,
        profiles!gorjetas_cliente_id_fkey (nome, foto_url)
      `)
      .eq("artista_id", artistId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Erro ao carregar gorjetas");
      return;
    }

    setGorjetas(data || []);
  };

  const fetchStats = async () => {
    if (!artistId) return;

    // Pedidos pendentes
    const { count: pendentes } = await supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .eq("artista_id", artistId)
      .eq("status", "pendente");

    // Pedidos aceitos
    const { count: aceitos } = await supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .eq("artista_id", artistId)
      .eq("status", "aceito");

    // Total de gorjetas
    const { data: totalGorjetas } = await supabase
      .from("gorjetas")
      .select("valor")
      .eq("artista_id", artistId);

    const total = totalGorjetas?.reduce((sum, g) => sum + g.valor, 0) || 0;

    // Gorjetas hoje
    const hoje = new Date().toISOString().split("T")[0];
    const { data: gorjetasHoje } = await supabase
      .from("gorjetas")
      .select("valor")
      .eq("artista_id", artistId)
      .gte("created_at", hoje);

    const totalHoje = gorjetasHoje?.reduce((sum, g) => sum + g.valor, 0) || 0;

    setStats({
      pedidos_pendentes: pendentes || 0,
      pedidos_aceitos: aceitos || 0,
      gorjetas_total: total,
      gorjetas_hoje: totalHoje,
    });
  };

  const fetchAnalytics = async () => {
    if (!artistId) return;

    // Últimos 7 dias
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
      .select("valor, created_at")
      .eq("artista_id", artistId)
      .gte("created_at", seteDiasAtras.toISOString());

    const gorjetasPorDia = Array.from({ length: 7 }, (_, i) => {
      const data = new Date();
      data.setDate(data.getDate() - (6 - i));
      const dataStr = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const valor = gorjetasData?.filter(g => {
        const gorjetaData = new Date(g.created_at);
        return gorjetaData.toDateString() === data.toDateString();
      }).reduce((sum, g) => sum + g.valor, 0) || 0;
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
      .select("valor")
      .eq("artista_id", artistId);

    const ticketMedio = todasGorjetas && todasGorjetas.length > 0
      ? todasGorjetas.reduce((sum, g) => sum + g.valor, 0) / todasGorjetas.length
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

  const handleToggleLiveStatus = async (checked: boolean) => {
    if (!artistId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ ativo_ao_vivo: checked })
      .eq("id", artistId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    setAtivoAoVivo(checked);
    toast.success(checked ? "Você está ao vivo! 🔴" : "Status ao vivo desativado");
  };

  const handleUpdatePedidoStatus = async (pedidoId: string, newStatus: string) => {
    const { error } = await supabase
      .from("pedidos")
      .update({ status: newStatus })
      .eq("id", pedidoId);

    if (error) {
      toast.error("Erro ao atualizar pedido");
      return;
    }

    toast.success(newStatus === "aceito" ? "Pedido aceito! ✅" : "Pedido recusado");
    fetchPedidos();
    fetchStats();
    fetchAnalytics();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const pedidosPendentes = pedidos.filter((p) => p.status === "pendente");
  const pedidosAceitos = pedidos.filter((p) => p.status === "aceito");
  const pedidosRecusados = pedidos.filter((p) => p.status === "recusado");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-gradient">Painel do Artista</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/mensagens")}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Mensagens
            </Button>
            <Button variant="outline" onClick={() => navigate("/configuracoes")}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button variant="outline" onClick={() => navigate("/home")}>
              Ver como Cliente
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome and Live Status */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Olá, {artistName}! 👋</h2>
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${ativoAoVivo ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
                  <Label htmlFor="live-status" className="text-lg cursor-pointer">
                    Status: {ativoAoVivo ? "AO VIVO 🔴" : "Offline"}
                  </Label>
                </div>
                <Switch
                  id="live-status"
                  checked={ativoAoVivo}
                  onCheckedChange={handleToggleLiveStatus}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {ativoAoVivo
                  ? "Você está visível como ao vivo para os clientes"
                  : "Ative para mostrar que está ao vivo"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pedidos Pendentes</CardDescription>
              <CardTitle className="text-4xl text-accent">{stats.pedidos_pendentes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pedidos Aceitos</CardDescription>
              <CardTitle className="text-4xl text-primary">{stats.pedidos_aceitos}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Gorjetas Hoje</CardDescription>
              <CardTitle className="text-4xl text-green-600">
                R$ {stats.gorjetas_hoje.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total em Gorjetas</CardDescription>
              <CardTitle className="text-4xl text-green-600">
                R$ {stats.gorjetas_total.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs for Pedidos and Gorjetas */}
        <Tabs defaultValue="pendentes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="pendentes">
              Pendentes ({pedidosPendentes.length})
            </TabsTrigger>
            <TabsTrigger value="aceitos">
              Aceitos ({pedidosAceitos.length})
            </TabsTrigger>
            <TabsTrigger value="recusados">
              Recusados ({pedidosRecusados.length})
            </TabsTrigger>
            <TabsTrigger value="gorjetas">
              Gorjetas ({gorjetas.length})
            </TabsTrigger>
          </TabsList>

          {/* Analytics Dashboard */}
          <TabsContent value="analytics">
            <AnalyticsDashboard data={analyticsData} />
          </TabsContent>

          {/* Pedidos Pendentes */}
          <TabsContent value="pendentes" className="space-y-4">
            {pedidosPendentes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhum pedido pendente no momento
                </CardContent>
              </Card>
            ) : (
              pedidosPendentes.map((pedido) => (
                <Card key={pedido.id} className="border-accent/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar>
                          <AvatarImage src={pedido.profiles.foto_url} />
                          <AvatarFallback>{pedido.profiles.nome[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{pedido.profiles.nome}</p>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(pedido.created_at).toLocaleString("pt-BR")}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <Music className="w-4 h-4 text-primary" />
                            <p className="font-medium text-lg">{pedido.musica}</p>
                          </div>
                          {pedido.mensagem && (
                            <p className="text-sm text-muted-foreground italic">
                              "{pedido.mensagem}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdatePedidoStatus(pedido.id, "aceito")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdatePedidoStatus(pedido.id, "recusado")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pedidos Aceitos */}
          <TabsContent value="aceitos" className="space-y-4">
            {pedidosAceitos.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhum pedido aceito ainda
                </CardContent>
              </Card>
            ) : (
              pedidosAceitos.map((pedido) => (
                <Card key={pedido.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={pedido.profiles.foto_url} />
                        <AvatarFallback>{pedido.profiles.nome[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{pedido.profiles.nome}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(pedido.created_at).toLocaleString("pt-BR")}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <Music className="w-4 h-4 text-primary" />
                          <p className="font-medium text-lg">{pedido.musica}</p>
                          <Badge variant="default" className="ml-2">Aceito</Badge>
                        </div>
                        {pedido.mensagem && (
                          <p className="text-sm text-muted-foreground italic">
                            "{pedido.mensagem}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pedidos Recusados */}
          <TabsContent value="recusados" className="space-y-4">
            {pedidosRecusados.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhum pedido recusado
                </CardContent>
              </Card>
            ) : (
              pedidosRecusados.map((pedido) => (
                <Card key={pedido.id} className="opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={pedido.profiles.foto_url} />
                        <AvatarFallback>{pedido.profiles.nome[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{pedido.profiles.nome}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(pedido.created_at).toLocaleString("pt-BR")}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <Music className="w-4 h-4" />
                          <p className="font-medium">{pedido.musica}</p>
                          <Badge variant="secondary" className="ml-2">Recusado</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Gorjetas */}
          <TabsContent value="gorjetas" className="space-y-4">
            {gorjetas.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhuma gorjeta recebida ainda
                </CardContent>
              </Card>
            ) : (
              gorjetas.map((gorjeta) => (
                <Card key={gorjeta.id} className="border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={gorjeta.profiles.foto_url} />
                          <AvatarFallback>{gorjeta.profiles.nome[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{gorjeta.profiles.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(gorjeta.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        <p className="text-2xl font-bold text-green-600">
                          R$ {gorjeta.valor.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ArtistPanel;
