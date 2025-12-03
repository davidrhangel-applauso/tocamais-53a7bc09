import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, Heart, Check, X, CheckCheck, Menu } from "lucide-react";
import { toast } from "sonner";
import PaymentHistory from "@/components/PaymentHistory";
import NotificationBell from "@/components/NotificationBell";
import { MercadoPagoLink } from "@/components/MercadoPagoLink";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import MusicRepertoire from "@/components/MusicRepertoire";

interface Pedido {
  id: string;
  musica: string;
  mensagem: string | null;
  status: string;
  created_at: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  profiles: {
    nome: string;
    foto_url: string;
  } | null;
}

interface Gorjeta {
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
    foto_url: string;
  } | null;
}

interface Stats {
  pedidos_pendentes: number;
  pedidos_aceitos: number;
  gorjetas_total: number;
  gorjetas_hoje: number;
}


const ArtistPanel = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [artistName, setArtistName] = useState("");
  const [artistPhoto, setArtistPhoto] = useState<string | undefined>();
  const [ativoAoVivo, setAtivoAoVivo] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [gorjetas, setGorjetas] = useState<Gorjeta[]>([]);
  const [stats, setStats] = useState<Stats>({
    pedidos_pendentes: 0,
    pedidos_aceitos: 0,
    gorjetas_total: 0,
    gorjetas_hoje: 0,
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
      .select("tipo, nome, ativo_ao_vivo, foto_url")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setProfileExists(false);
      navigate("/home");
      return;
    }

    setProfileExists(true);

    if (profile.tipo !== "artista") {
      navigate("/home");
      return;
    }

    setArtistId(user.id);
    setArtistName(profile.nome);
    setArtistPhoto(profile.foto_url || undefined);
    setAtivoAoVivo(profile.ativo_ao_vivo || false);
  };

  const fetchData = () => {
    fetchPedidos();
    fetchGorjetas();
    fetchStats();
    setLoading(false);
  };

  const fetchPedidos = async () => {
    if (!artistId) return;

    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("artista_id", artistId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos");
      return;
    }

    // Buscar profiles apenas para pedidos com cliente_id
    const pedidosComProfiles = await Promise.all(
      (data || []).map(async (pedido) => {
        if (pedido.cliente_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome, foto_url")
            .eq("id", pedido.cliente_id)
            .maybeSingle();
          
          return { ...pedido, profiles: profile };
        }
        return { ...pedido, profiles: null };
      })
    );

    setPedidos(pedidosComProfiles);
  };

  const fetchGorjetas = async () => {
    if (!artistId) return;

    const { data, error } = await supabase
      .from("gorjetas")
      .select("*")
      .eq("artista_id", artistId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Erro ao carregar gorjetas");
      return;
    }

    // Buscar profiles apenas para gorjetas com cliente_id
    const gorjetasComProfiles = await Promise.all(
      (data || []).map(async (gorjeta) => {
        if (gorjeta.cliente_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome, foto_url")
            .eq("id", gorjeta.cliente_id)
            .maybeSingle();
          
          return { ...gorjeta, profiles: profile };
        }
        return { ...gorjeta, profiles: null };
      })
    );

    setGorjetas(gorjetasComProfiles);
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

    // Total de gorjetas - usando valor_liquido_artista (90% do valor)
    const { data: totalGorjetas } = await supabase
      .from("gorjetas")
      .select("valor_liquido_artista, status_pagamento")
      .eq("artista_id", artistId)
      .eq("status_pagamento", "approved"); // Apenas gorjetas aprovadas

    const total = totalGorjetas?.reduce((sum, g) => sum + (g.valor_liquido_artista || 0), 0) || 0;

    // Gorjetas hoje - usando valor_liquido_artista
    const hoje = new Date().toISOString().split("T")[0];
    const { data: gorjetasHoje } = await supabase
      .from("gorjetas")
      .select("valor_liquido_artista, status_pagamento")
      .eq("artista_id", artistId)
      .eq("status_pagamento", "approved")
      .gte("created_at", hoje);

    const totalHoje = gorjetasHoje?.reduce((sum, g) => sum + (g.valor_liquido_artista || 0), 0) || 0;

    setStats({
      pedidos_pendentes: pendentes || 0,
      pedidos_aceitos: aceitos || 0,
      gorjetas_total: total,
      gorjetas_hoje: totalHoje,
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
      console.error("Erro ao atualizar pedido:", error);
      toast.error(`Erro ao atualizar pedido: ${error.message ?? "tente novamente"}`);
      return;
    }

    toast.success(newStatus === "aceito" ? "Pedido aceito! ✅" : "Pedido recusado");
    fetchPedidos();
    fetchStats();
  };

  const handleBulkAction = async (action: "aceito" | "recusado") => {
    if (selectedPedidos.length === 0) {
      toast.error("Selecione pelo menos um pedido");
      return;
    }

    const { error } = await supabase
      .from("pedidos")
      .update({ status: action })
      .in("id", selectedPedidos);

    if (error) {
      console.error("Erro ao atualizar pedidos em massa:", error);
      toast.error(`Erro ao atualizar pedidos: ${error.message ?? "tente novamente"}`);
      return;
    }

    toast.success(`${selectedPedidos.length} pedido(s) ${action === "aceito" ? "aceito(s)" : "recusado(s)"}`);
    setSelectedPedidos([]);
    fetchPedidos();
    fetchStats();
  };

  const handleMarkAsComplete = async (pedidoId: string) => {
    const { error } = await supabase
      .from("pedidos")
      .update({ status: "concluido" })
      .eq("id", pedidoId);

    if (error) {
      console.error("Erro ao marcar pedido como concluído:", error);
      toast.error(`Erro ao marcar como concluído: ${error.message ?? "tente novamente"}`);
      return;
    }

    toast.success("Pedido marcado como concluído! 🎵");
    fetchPedidos();
    fetchStats();
  };

  const togglePedidoSelection = (pedidoId: string) => {
    setSelectedPedidos(prev =>
      prev.includes(pedidoId)
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const toggleAllPedidos = (pedidos: Pedido[]) => {
    const pedidoIds = pedidos.map(p => p.id);
    setSelectedPedidos(prev =>
      prev.length === pedidoIds.length ? [] : pedidoIds
    );
  };

  const pedidosPendentes = pedidos.filter((p) => p.status === "pendente");
  const pedidosAceitos = pedidos.filter((p) => p.status === "aceito");
  const pedidosRecusados = pedidos.filter((p) => p.status === "recusado");
  const pedidosConcluidos = pedidos.filter((p) => p.status === "concluido");

  const currentTab = searchParams.get("tab") || "pendentes";

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
              <Music className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-gradient">Painel do Artista</h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell userId={artistId || undefined} />
              <Button variant="outline" size="sm" onClick={() => navigate("/home?preview=true")}>
                Ver como Cliente
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
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
              <p className="text-xs text-muted-foreground mt-2">
                Valor líquido após dedução de 10% da taxa da plataforma
              </p>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs for Pedidos and Gorjetas */}
        <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-6">
          <TabsList className="inline-flex w-full justify-start overflow-x-auto gap-1 pb-1">
            <TabsTrigger value="pendentes" className="whitespace-nowrap">
              ⏳ Pendentes ({pedidosPendentes.length})
            </TabsTrigger>
            <TabsTrigger value="aceitos" className="whitespace-nowrap">
              ✅ Aceitos ({pedidosAceitos.length})
            </TabsTrigger>
            <TabsTrigger value="concluidos" className="whitespace-nowrap">
              ✔ Concluídos ({pedidosConcluidos.length})
            </TabsTrigger>
            <TabsTrigger value="recusados" className="whitespace-nowrap">
              ❌ Recusados ({pedidosRecusados.length})
            </TabsTrigger>
            <TabsTrigger value="gorjetas" className="whitespace-nowrap">
              💝 Gorjetas ({gorjetas.length})
            </TabsTrigger>
            <TabsTrigger value="historico" className="whitespace-nowrap">
              💰 Pagamentos
            </TabsTrigger>
            <TabsTrigger value="repertorio" className="whitespace-nowrap">
              🎵 Repertório
            </TabsTrigger>
          </TabsList>

          {/* Histórico de Pagamentos */}
          <TabsContent value="historico" className="space-y-6">
            {artistId && <MercadoPagoLink userId={artistId} />}
            <PaymentHistory gorjetas={gorjetas} />
          </TabsContent>

          {/* Repertório */}
          <TabsContent value="repertorio" className="space-y-6">
            {artistId && <MusicRepertoire artistaId={artistId} />}
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
              <>
                {/* Ações em massa */}
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedPedidos.length === pedidosPendentes.length && pedidosPendentes.length > 0}
                          onCheckedChange={() => toggleAllPedidos(pedidosPendentes)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedPedidos.length > 0 ? `${selectedPedidos.length} selecionado(s)` : "Selecionar todos"}
                        </span>
                      </div>
                      {selectedPedidos.length > 0 && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleBulkAction("aceito")}>
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar Selecionados
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleBulkAction("recusado")}>
                            <X className="w-4 h-4 mr-1" />
                            Recusar Selecionados
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {pedidosPendentes.map((pedido) => (
                  <Card key={pedido.id} className="border-accent/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedPedidos.includes(pedido.id)}
                            onCheckedChange={() => togglePedidoSelection(pedido.id)}
                          />
                        </div>
                        <div className="flex items-start gap-4 flex-1">
                        <Avatar>
                          <AvatarImage src={pedido.profiles?.foto_url} />
                          <AvatarFallback>{(pedido.profiles?.nome || pedido.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{pedido.profiles?.nome || pedido.cliente_nome || "Anônimo"}</p>
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
              }
              </>
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
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar>
                          <AvatarImage src={pedido.profiles?.foto_url} />
                          <AvatarFallback>{(pedido.profiles?.nome || pedido.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{pedido.profiles?.nome || pedido.cliente_nome || "Anônimo"}</p>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsComplete(pedido.id)}
                      >
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Marcar como Concluído
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pedidos Concluídos */}
          <TabsContent value="concluidos" className="space-y-4">
            {pedidosConcluidos.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhum pedido concluído ainda
                </CardContent>
              </Card>
            ) : (
              pedidosConcluidos.map((pedido) => (
                <Card key={pedido.id} className="border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={pedido.profiles?.foto_url} />
                        <AvatarFallback>{(pedido.profiles?.nome || pedido.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{pedido.profiles?.nome || pedido.cliente_nome || "Anônimo"}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(pedido.created_at).toLocaleString("pt-BR")}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <Music className="w-4 h-4 text-green-600" />
                          <p className="font-medium text-lg">{pedido.musica}</p>
                          <Badge className="ml-2 bg-green-600">✓ Concluído</Badge>
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
                        <AvatarImage src={pedido.profiles?.foto_url} />
                        <AvatarFallback>{(pedido.profiles?.nome || pedido.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{pedido.profiles?.nome || pedido.cliente_nome || "Anônimo"}</p>
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
                          <AvatarImage src={gorjeta.profiles?.foto_url} />
                          <AvatarFallback>{(gorjeta.profiles?.nome || gorjeta.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{gorjeta.profiles?.nome || gorjeta.cliente_nome || "Anônimo"}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(gorjeta.created_at).toLocaleString("pt-BR")}
                          </p>
                          {gorjeta.status_pagamento && (
                            <Badge 
                              variant={
                                gorjeta.status_pagamento === 'approved' ? 'default' : 
                                gorjeta.status_pagamento === 'pending' ? 'secondary' : 
                                'destructive'
                              }
                              className="mt-2"
                            >
                              {gorjeta.status_pagamento === 'approved' ? '✓ Confirmado' : 
                               gorjeta.status_pagamento === 'pending' ? '⏳ Aguardando' : 
                               '✗ Expirado'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                          <p className="text-2xl font-bold text-green-600">
                            R$ {(gorjeta.valor_liquido_artista || 0).toFixed(2)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          (90% de R$ {gorjeta.valor.toFixed(2)})
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Repertório Musical */}
          <TabsContent value="repertorio">
            {artistId && <MusicRepertoire artistaId={artistId} />}
          </TabsContent>
        </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ArtistPanel;
