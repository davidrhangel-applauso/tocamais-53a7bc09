import { useEffect, useState, useCallback, useMemo } from "react";
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
import { SetlistManager } from "@/components/SetlistManager";
import { useSubscription } from "@/hooks/useSubscription";
import { useArtistPedidos, useUpdatePedidoStatus, useBulkUpdatePedidos, useConfirmPixPayment, useDeletePedido, useArchivePedido, Pedido } from "@/hooks/useArtistPedidos";
import { useArtistGorjetas, Gorjeta } from "@/hooks/useArtistGorjetas";
import { useArtistStats } from "@/hooks/useArtistStats";
import { SkeletonStatsGrid, SkeletonPedidoList } from "@/components/ui/skeleton-card";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ClearOldOrdersDialog } from "@/components/ClearOldOrdersDialog";
import { SwipeablePedidoCard } from "@/components/SwipeablePedidoCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

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

  // Use React Query hooks
  const queryClient = useQueryClient();
  const { data: pedidos = [], isLoading: pedidosLoading } = useArtistPedidos(artistId);
  const { data: gorjetas = [], isLoading: gorjetasLoading } = useArtistGorjetas(artistId);
  const { data: stats, isLoading: statsLoading } = useArtistStats(artistId);
  const updatePedidoStatus = useUpdatePedidoStatus();
  const bulkUpdatePedidos = useBulkUpdatePedidos();
  const confirmPixPayment = useConfirmPixPayment();
  const deletePedido = useDeletePedido();
  const archivePedido = useArchivePedido();
  const isMobile = useIsMobile();

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["artist-pedidos", artistId] }),
      queryClient.invalidateQueries({ queryKey: ["artist-gorjetas", artistId] }),
      queryClient.invalidateQueries({ queryKey: ["artist-stats", artistId] }),
    ]);
  }, [queryClient, artistId]);

  // Check subscription status
  const { isPro } = useSubscription(artistId);

  useEffect(() => {
    checkAuth();
  }, []);

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
    setLoading(false);
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
    toast.success(checked ? "Você está ao vivo!" : "Status ao vivo desativado");
  };

  const handleUpdatePedidoStatus = (pedidoId: string, newStatus: string) => {
    updatePedidoStatus.mutate({ pedidoId, status: newStatus });
  };

  const handleBulkAction = (action: "aceito" | "recusado") => {
    if (selectedPedidos.length === 0) {
      toast.error("Selecione pelo menos um pedido");
      return;
    }
    bulkUpdatePedidos.mutate(
      { pedidoIds: selectedPedidos, status: action },
      { onSuccess: () => setSelectedPedidos([]) }
    );
  };

  const handleMarkAsComplete = (pedidoId: string) => {
    updatePedidoStatus.mutate({ pedidoId, status: "concluido" });
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
  const pedidosAguardandoPixConfirmacao = pedidos.filter((p) => p.status === "aguardando_confirmacao_pix");

  const currentTab = searchParams.get("tab") || "pendentes";

  // Tab order for swipe navigation
  const tabOrder = useMemo(() => {
    const tabs = ["pendentes", "aceitos", "gorjetas", "repertorio"];
    // Add PIX tab if there are pending confirmations
    if (pedidosAguardandoPixConfirmacao.length > 0) {
      tabs.splice(2, 0, "aguardando_pix");
    }
    return tabs;
  }, [pedidosAguardandoPixConfirmacao.length]);

  // Swipe navigation handlers
  const navigateToNextTab = useCallback(() => {
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex < tabOrder.length - 1) {
      setSearchParams({ tab: tabOrder[currentIndex + 1] });
    }
  }, [currentTab, tabOrder, setSearchParams]);

  const navigateToPrevTab = useCallback(() => {
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex > 0) {
      setSearchParams({ tab: tabOrder[currentIndex - 1] });
    }
  }, [currentTab, tabOrder, setSearchParams]);

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: navigateToNextTab,
    onSwipeRight: navigateToPrevTab,
    threshold: 60,
    allowedTime: 400,
  });

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
          <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-40 h-14 sm:h-16 flex items-center px-3 sm:px-6">
            <SidebarTrigger className="mr-2 sm:mr-4">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <h1 className="text-base sm:text-xl font-bold text-gradient truncate">Painel</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell userId={artistId || undefined} />
              <Button variant="outline" size="sm" onClick={() => navigate("/home?preview=true")} className="hidden sm:inline-flex">
                Ver como Cliente
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/home?preview=true")} className="sm:hidden h-8 w-8">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <PullToRefresh onRefresh={handleRefresh} className="flex-1 overflow-auto">
            <div 
              className="p-3 sm:p-6"
              {...(isMobile ? swipeHandlers : {})}
            >
        {/* Welcome and Live Status */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-3xl font-bold">Olá, {artistName}! 👋</h2>
            {isPro ? (
              <Badge className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0">
                ⭐ Pro
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
                Free
              </Badge>
            )}
          </div>
          <Card className="border-primary/20">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 ${ativoAoVivo ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                  <Label htmlFor="live-status" className="text-sm sm:text-lg cursor-pointer">
                    {ativoAoVivo ? "Ao Vivo" : "Offline"}
                  </Label>
                </div>
                <Switch
                  id="live-status"
                  checked={ativoAoVivo}
                  onCheckedChange={handleToggleLiveStatus}
                />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                {ativoAoVivo
                  ? "Visível para clientes"
                  : "Ative para aparecer ao vivo"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <SkeletonStatsGrid />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
            <Card className="overflow-hidden">
              <CardHeader className="p-3 sm:pb-3 sm:p-6">
                <CardDescription className="text-xs sm:text-sm">Pendentes</CardDescription>
                <CardTitle className="text-2xl sm:text-4xl text-accent">{stats?.pedidos_pendentes ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="p-3 sm:pb-3 sm:p-6">
                <CardDescription className="text-xs sm:text-sm">Aceitos</CardDescription>
                <CardTitle className="text-2xl sm:text-4xl text-primary">{stats?.pedidos_aceitos ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="p-3 sm:pb-3 sm:p-6">
                <CardDescription className="text-xs sm:text-sm">Hoje</CardDescription>
                <CardTitle className="text-xl sm:text-4xl text-green-600">
                  R$ {(stats?.gorjetas_hoje ?? 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="p-3 sm:pb-3 sm:p-6">
                <CardDescription className="text-xs sm:text-sm">Total</CardDescription>
                <CardTitle className="text-xl sm:text-4xl text-green-600">
                  R$ {(stats?.gorjetas_total ?? 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}
        {/* Alert for pending PIX confirmations */}
        {pedidosAguardandoPixConfirmacao.length > 0 && currentTab !== "aguardando_pix" && (
          <Card className="border-amber-500 bg-amber-500/10 mb-4 animate-pulse cursor-pointer" onClick={() => setSearchParams({ tab: "aguardando_pix" })}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold">
                  {pedidosAguardandoPixConfirmacao.length}
                </div>
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    {pedidosAguardandoPixConfirmacao.length === 1 
                      ? "1 PIX aguardando confirmação" 
                      : `${pedidosAguardandoPixConfirmacao.length} PIX aguardando confirmação`}
                  </p>
                  <p className="text-sm text-muted-foreground">Clique aqui para confirmar recebimento e registrar na sua conta</p>
                </div>
              </div>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                <Check className="w-4 h-4 mr-1" />
                Confirmar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Pedidos and Gorjetas */}
        <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-4 sm:space-y-6">
          {/* TabsList - hidden on mobile since we use MobileBottomNav */}
          <div className="hidden sm:flex sm:flex-row sm:items-center justify-between gap-4">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex w-auto h-auto gap-1 p-1">
                {pedidosAguardandoPixConfirmacao.length > 0 && (
                  <TabsTrigger value="aguardando_pix" className="text-sm px-3 py-2 bg-amber-500/10 border-amber-500/30 whitespace-nowrap">
                    💰 PIX ({pedidosAguardandoPixConfirmacao.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="pendentes" className="text-sm px-3 py-2 whitespace-nowrap">
                  ⏳ Pendentes ({pedidosPendentes.length})
                </TabsTrigger>
                <TabsTrigger value="aceitos" className="text-sm px-3 py-2 whitespace-nowrap">
                  ✅ Aceitos ({pedidosAceitos.length})
                </TabsTrigger>
                <TabsTrigger value="concluidos" className="text-sm px-3 py-2 whitespace-nowrap">
                  ✔ Concluídos ({pedidosConcluidos.length})
                </TabsTrigger>
                <TabsTrigger value="recusados" className="text-sm px-3 py-2 whitespace-nowrap">
                  ❌ Recusados ({pedidosRecusados.length})
                </TabsTrigger>
                <TabsTrigger value="gorjetas" className="text-sm px-3 py-2 whitespace-nowrap">
                  💝 Gorjetas ({gorjetas.length})
                </TabsTrigger>
                <TabsTrigger value="historico" className="text-sm px-3 py-2 whitespace-nowrap">
                  💰 Histórico
                </TabsTrigger>
                <TabsTrigger value="repertorio" className="text-sm px-3 py-2 whitespace-nowrap">
                  🎵 Repertório
                </TabsTrigger>
                <TabsTrigger value="setlists" className="text-sm px-3 py-2 whitespace-nowrap">
                  📋 Setlists
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Clear old orders button - show when there are old orders */}
            {(pedidosConcluidos.length > 0 || pedidosRecusados.length > 0) && artistId && (
              <ClearOldOrdersDialog 
                artistId={artistId} 
                counts={{
                  concluidos: pedidosConcluidos.length,
                  recusados: pedidosRecusados.length,
                }}
              />
            )}
          </div>

          {/* Mobile: Clear old orders button inline */}
          {isMobile && (pedidosConcluidos.length > 0 || pedidosRecusados.length > 0) && artistId && (
            <div className="flex justify-end">
              <ClearOldOrdersDialog 
                artistId={artistId} 
                counts={{
                  concluidos: pedidosConcluidos.length,
                  recusados: pedidosRecusados.length,
                }}
              />
            </div>
          )}

          {/* Aguardando Confirmação PIX - Only for PRO artists with own PIX */}
          <TabsContent value="aguardando_pix" className="space-y-4">
            {pedidosAguardandoPixConfirmacao.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhum pagamento PIX aguardando confirmação
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-amber-600 dark:text-amber-400">💡 PIX Próprio:</strong> Esses clientes afirmam ter feito um PIX direto para você. 
                      Verifique seu extrato bancário e confirme os recebimentos.
                    </p>
                  </CardContent>
                </Card>

                {pedidosAguardandoPixConfirmacao.map((pedido) => (
                  <Card key={pedido.id} className="border-amber-500/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10 shrink-0">
                              <AvatarImage src={pedido.profiles?.foto_url || undefined} />
                              <AvatarFallback>{(pedido.profiles?.nome || pedido.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{pedido.profiles?.nome || pedido.cliente_nome || "Anônimo"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(pedido.created_at).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            {pedido.valor && (
                              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                                R$ {pedido.valor.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Music className="w-4 h-4 text-primary shrink-0" />
                            <p className="font-medium truncate">{pedido.musica}</p>
                          </div>
                          {pedido.mensagem && (
                            <p className="text-sm text-muted-foreground italic mb-3 line-clamp-2">
                              "{pedido.mensagem}"
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => confirmPixPayment.mutate({ pedido })}
                              disabled={confirmPixPayment.isPending}
                              className="flex-1 sm:flex-none"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Confirmar Recebimento
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdatePedidoStatus(pedido.id, "recusado")}
                              disabled={updatePedidoStatus.isPending}
                              className="flex-1 sm:flex-none"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Não Recebi
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* Histórico de Pagamentos */}
          <TabsContent value="historico" className="space-y-4 sm:space-y-6">
            {/* Histórico de Pagamentos primeiro - mais importante */}
            <PaymentHistory gorjetas={gorjetas} />
            
            {/* MercadoPago e Dicas em acordeão colapsável no mobile */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-3 sm:p-4 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                <span className="font-medium text-sm sm:text-base flex items-center gap-2">
                  💳 Configurações de Pagamento
                </span>
                <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 space-y-4">
                {artistId && <MercadoPagoLink userId={artistId} />}
                
                {/* Aviso sobre liberação de pagamentos - compacto */}
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardHeader className="p-3 sm:pb-3 sm:p-6">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <span>⏱️</span>
                      Receber mais rápido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <p>
                      Por padrão, o Mercado Pago retém os pagamentos por até 14 dias. Para receber mais rápido:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-xs">
                      <li><strong>Verificar sua conta</strong> no app do Mercado Pago</li>
                      <li><strong>Ativar liberação imediata</strong> em Seu negócio → Configurações</li>
                      <li><strong>Manter histórico positivo</strong> de vendas</li>
                    </ol>
                    <p className="text-[10px] sm:text-xs pt-2 border-t border-border/50">
                      💡 Contas verificadas podem receber em até 24h.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </details>
          </TabsContent>

          {/* Repertório */}
          <TabsContent value="repertorio" className="space-y-6">
            {artistId && <MusicRepertoire artistaId={artistId} />}
          </TabsContent>

          {/* Setlists */}
          <TabsContent value="setlists" className="space-y-6">
            {artistId && <SetlistManager artistaId={artistId} />}
          </TabsContent>

          {/* Pedidos Pendentes */}
          <TabsContent value="pendentes" className="space-y-4">
            {pedidosLoading ? (
              <SkeletonPedidoList count={3} />
            ) : pedidosPendentes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhum pedido pendente no momento
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Ações em massa */}
                <Card className="border-primary/20">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedPedidos.length === pedidosPendentes.length && pedidosPendentes.length > 0}
                          onCheckedChange={() => toggleAllPedidos(pedidosPendentes)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedPedidos.length > 0 ? `${selectedPedidos.length} selecionado(s)` : "Selecionar todos"}
                        </span>
                      </div>
                      {selectedPedidos.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button 
                            size="sm" 
                            onClick={() => handleBulkAction("aceito")} 
                            disabled={bulkUpdatePedidos.isPending}
                            className="w-full sm:w-auto"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleBulkAction("recusado")} 
                            disabled={bulkUpdatePedidos.isPending}
                            className="w-full sm:w-auto"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {pedidosPendentes.map((pedido) => (
                  <Card key={pedido.id} className="border-accent/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedPedidos.includes(pedido.id)}
                          onCheckedChange={() => togglePedidoSelection(pedido.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10 shrink-0">
                              <AvatarImage src={pedido.profiles?.foto_url || undefined} />
                              <AvatarFallback>{(pedido.profiles?.nome || pedido.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{pedido.profiles?.nome || pedido.cliente_nome || "Anônimo"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(pedido.created_at).toLocaleString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Music className="w-4 h-4 text-primary shrink-0" />
                            <p className="font-medium truncate">{pedido.musica}</p>
                          </div>
                          {pedido.mensagem && (
                            <p className="text-sm text-muted-foreground italic mb-3 line-clamp-2">
                              "{pedido.mensagem}"
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePedidoStatus(pedido.id, "aceito")}
                              disabled={updatePedidoStatus.isPending}
                              className="flex-1 sm:flex-none"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdatePedidoStatus(pedido.id, "recusado")}
                              disabled={updatePedidoStatus.isPending}
                              className="flex-1 sm:flex-none"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Recusar
                            </Button>
                          </div>
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
            {pedidosLoading ? (
              <SkeletonPedidoList count={3} />
            ) : pedidosAceitos.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhum pedido aceito ainda
                </CardContent>
              </Card>
            ) : (
              pedidosAceitos.map((pedido) => (
                <Card key={pedido.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={pedido.profiles?.foto_url || undefined} />
                        <AvatarFallback>{(pedido.profiles?.nome || pedido.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{pedido.profiles?.nome || pedido.cliente_nome || "Anônimo"}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(pedido.created_at).toLocaleString("pt-BR")}
                        </p>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Music className="w-4 h-4 text-primary shrink-0" />
                          <p className="font-medium truncate">{pedido.musica}</p>
                          <Badge variant="default">Aceito</Badge>
                        </div>
                        {pedido.mensagem && (
                          <p className="text-sm text-muted-foreground italic mb-3 line-clamp-2">
                            "{pedido.mensagem}"
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsComplete(pedido.id)}
                          disabled={updatePedidoStatus.isPending}
                          className="w-full sm:w-auto"
                        >
                          <CheckCheck className="w-4 h-4 mr-1" />
                          Concluído
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pedidos Concluídos */}
          <TabsContent value="concluidos" className="space-y-4">
            {pedidosLoading ? (
              <SkeletonPedidoList count={3} />
            ) : pedidosConcluidos.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhum pedido concluído ainda
                </CardContent>
              </Card>
            ) : (
              <>
                {isMobile && (
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    👆 Deslize para arquivar (←) ou excluir (→)
                  </p>
                )}
                {pedidosConcluidos.map((pedido) => (
                  <SwipeablePedidoCard
                    key={pedido.id}
                    onSwipeLeft={() => archivePedido.mutate({ pedidoId: pedido.id })}
                    onSwipeRight={() => deletePedido.mutate({ pedidoId: pedido.id })}
                    disabled={!isMobile}
                  >
                    <Card className="border-green-500/20">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 shrink-0">
                            <AvatarImage src={pedido.profiles?.foto_url || undefined} />
                            <AvatarFallback>{(pedido.profiles?.nome || pedido.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{pedido.profiles?.nome || pedido.cliente_nome || "Anônimo"}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {new Date(pedido.created_at).toLocaleString("pt-BR")}
                            </p>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Music className="w-4 h-4 text-green-600 shrink-0" />
                              <p className="font-medium truncate">{pedido.musica}</p>
                              <Badge className="bg-green-600 text-xs">✓</Badge>
                            </div>
                            {pedido.mensagem && (
                              <p className="text-sm text-muted-foreground italic line-clamp-2">
                                "{pedido.mensagem}"
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SwipeablePedidoCard>
                ))}
              </>
            )}
          </TabsContent>

          {/* Pedidos Recusados */}
          <TabsContent value="recusados" className="space-y-4">
            {pedidosLoading ? (
              <SkeletonPedidoList count={3} />
            ) : pedidosRecusados.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhum pedido recusado
                </CardContent>
              </Card>
            ) : (
              <>
                {isMobile && (
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    👆 Deslize para arquivar (←) ou excluir (→)
                  </p>
                )}
                {pedidosRecusados.map((pedido) => (
                  <SwipeablePedidoCard
                    key={pedido.id}
                    onSwipeLeft={() => archivePedido.mutate({ pedidoId: pedido.id })}
                    onSwipeRight={() => deletePedido.mutate({ pedidoId: pedido.id })}
                    disabled={!isMobile}
                  >
                    <Card className="opacity-60">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 shrink-0">
                            <AvatarImage src={pedido.profiles?.foto_url || undefined} />
                            <AvatarFallback>{(pedido.profiles?.nome || pedido.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{pedido.profiles?.nome || pedido.cliente_nome || "Anônimo"}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {new Date(pedido.created_at).toLocaleString("pt-BR")}
                            </p>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Music className="w-4 h-4 text-muted-foreground shrink-0" />
                              <p className="font-medium truncate">{pedido.musica}</p>
                              <Badge variant="destructive" className="text-xs">✗</Badge>
                            </div>
                            {pedido.mensagem && (
                              <p className="text-sm text-muted-foreground italic line-clamp-2">
                                "{pedido.mensagem}"
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SwipeablePedidoCard>
                ))}
              </>
            )}
          </TabsContent>

          {/* Gorjetas */}
          <TabsContent value="gorjetas" className="space-y-4">
            {gorjetasLoading ? (
              <SkeletonPedidoList count={3} />
            ) : gorjetas.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nenhuma gorjeta recebida ainda
                </CardContent>
              </Card>
            ) : (
              gorjetas.map((gorjeta) => (
                <Card key={gorjeta.id} className={gorjeta.status_pagamento === 'approved' ? 'border-green-500/20' : 'border-amber-500/20'}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={gorjeta.profiles?.foto_url || undefined} />
                        <AvatarFallback>{(gorjeta.profiles?.nome || gorjeta.cliente_nome || "Anônimo")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold truncate">{gorjeta.profiles?.nome || gorjeta.cliente_nome || "Fã Anônimo"}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={gorjeta.status_pagamento === 'approved' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'}>
                              R$ {gorjeta.valor_liquido_artista.toFixed(2)}
                            </Badge>
                            {gorjeta.status_pagamento !== 'approved' && (
                              <Badge variant="outline" className="text-xs">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(gorjeta.created_at).toLocaleString("pt-BR")}
                        </p>
                        {gorjeta.pedido_musica && (
                          <div className="flex items-center gap-2 mb-1">
                            <Music className="w-4 h-4 text-primary shrink-0" />
                            <p className="text-sm font-medium truncate">{gorjeta.pedido_musica}</p>
                          </div>
                        )}
                        {gorjeta.pedido_mensagem && (
                          <p className="text-sm text-muted-foreground italic line-clamp-2">
                            "{gorjeta.pedido_mensagem}"
                          </p>
                        )}
                        {gorjeta.taxa_plataforma > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Valor bruto: R$ {gorjeta.valor.toFixed(2)} • Taxa: R$ {gorjeta.taxa_plataforma.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
            </div>
          </PullToRefresh>
          
          {/* Mobile Bottom Navigation */}
          <MobileBottomNav
            pendentes={pedidosPendentes.length}
            aceitos={pedidosAceitos.length}
            aguardandoPix={pedidosAguardandoPixConfirmacao.length}
            concluidos={pedidosConcluidos.length}
            recusados={pedidosRecusados.length}
            gorjetas={gorjetas.length}
          />
          
          {/* Bottom padding for mobile nav */}
          <div className="h-20 sm:hidden" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ArtistPanel;
