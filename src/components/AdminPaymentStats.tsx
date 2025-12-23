import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, CreditCard, Percent, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface PaymentStats {
  totalGorjetas: number;
  totalValorBruto: number;
  totalValorLiquido: number;
  totalTaxaPlataforma: number;
  gorjetasAprovadas: number;
  gorjetasPendentes: number;
  gorjetasCanceladas: number;
  mediaValor: number;
}

interface DailyStats {
  date: string;
  valor: number;
  quantidade: number;
}

interface ArtistRanking {
  artista_id: string;
  nome: string;
  foto_url: string | null;
  total: number;
  quantidade: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AdminPaymentStats() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [artistRanking, setArtistRanking] = useState<ArtistRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("30");

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const startDateStr = startDate.toISOString();

      // Fetch all gorjetas for the period
      const { data: gorjetas, error } = await supabase
        .from("gorjetas")
        .select("id, valor, valor_liquido_artista, taxa_plataforma, status_pagamento, created_at, artista_id")
        .gte("created_at", startDateStr)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Calculate stats
      const approved = gorjetas?.filter(g => g.status_pagamento === "approved") || [];
      const pending = gorjetas?.filter(g => g.status_pagamento === "pending") || [];
      const cancelled = gorjetas?.filter(g => g.status_pagamento === "cancelled" || g.status_pagamento === "rejected") || [];

      const totalValorBruto = approved.reduce((sum, g) => sum + Number(g.valor), 0);
      const totalValorLiquido = approved.reduce((sum, g) => sum + Number(g.valor_liquido_artista), 0);
      const totalTaxaPlataforma = approved.reduce((sum, g) => sum + Number(g.taxa_plataforma), 0);

      setStats({
        totalGorjetas: gorjetas?.length || 0,
        totalValorBruto,
        totalValorLiquido,
        totalTaxaPlataforma,
        gorjetasAprovadas: approved.length,
        gorjetasPendentes: pending.length,
        gorjetasCanceladas: cancelled.length,
        mediaValor: approved.length > 0 ? totalValorBruto / approved.length : 0
      });

      // Calculate daily stats
      const dailyMap = new Map<string, { valor: number; quantidade: number }>();
      approved.forEach(g => {
        const date = new Date(g.created_at!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const existing = dailyMap.get(date) || { valor: 0, quantidade: 0 };
        dailyMap.set(date, {
          valor: existing.valor + Number(g.valor),
          quantidade: existing.quantidade + 1
        });
      });

      const dailyArray = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        valor: data.valor,
        quantidade: data.quantidade
      }));
      setDailyStats(dailyArray);

      // Calculate artist ranking
      const artistMap = new Map<string, { total: number; quantidade: number }>();
      approved.forEach(g => {
        const existing = artistMap.get(g.artista_id) || { total: 0, quantidade: 0 };
        artistMap.set(g.artista_id, {
          total: existing.total + Number(g.valor),
          quantidade: existing.quantidade + 1
        });
      });

      // Fetch artist names
      const artistIds = Array.from(artistMap.keys());
      if (artistIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome, foto_url")
          .in("id", artistIds);

        const ranking = artistIds.map(id => {
          const profile = profiles?.find(p => p.id === id);
          const data = artistMap.get(id)!;
          return {
            artista_id: id,
            nome: profile?.nome || "Desconhecido",
            foto_url: profile?.foto_url || null,
            total: data.total,
            quantidade: data.quantidade
          };
        }).sort((a, b) => b.total - a.total).slice(0, 10);

        setArtistRanking(ranking);
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statusData = [
    { name: "Aprovadas", value: stats?.gorjetasAprovadas || 0, color: "hsl(var(--chart-2))" },
    { name: "Pendentes", value: stats?.gorjetasPendentes || 0, color: "hsl(var(--chart-4))" },
    { name: "Canceladas", value: stats?.gorjetasCanceladas || 0, color: "hsl(var(--destructive))" }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Estatísticas Financeiras
        </h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Volume Total (Bruto)
            </CardDescription>
            <CardTitle className="text-2xl text-primary">
              {formatCurrency(stats?.totalValorBruto || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.gorjetasAprovadas || 0} gorjetas aprovadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Taxa Plataforma
            </CardDescription>
            <CardTitle className="text-2xl text-chart-2">
              {formatCurrency(stats?.totalTaxaPlataforma || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.totalValorBruto ? ((stats.totalTaxaPlataforma / stats.totalValorBruto) * 100).toFixed(1) : 0}% do volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Média por Gorjeta
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(stats?.mediaValor || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Valor médio das transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Total Transações
            </CardDescription>
            <CardTitle className="text-2xl">
              {stats?.totalGorjetas || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.gorjetasPendentes || 0} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Evolução</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="ranking">Ranking Artistas</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Gorjetas</CardTitle>
              <CardDescription>Volume diário de gorjetas aprovadas</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyStats.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis tickFormatter={(v) => `R$${v}`} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), "Valor"]}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Status das gorjetas no período</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Artistas</CardTitle>
              <CardDescription>Artistas com maior volume de gorjetas</CardDescription>
            </CardHeader>
            <CardContent>
              {artistRanking.length > 0 ? (
                <div className="space-y-4">
                  {artistRanking.map((artist, index) => (
                    <div key={artist.artista_id} className="flex items-center gap-4">
                      <span className="w-6 text-center font-bold text-muted-foreground">
                        {index + 1}º
                      </span>
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                        {artist.foto_url ? (
                          <img src={artist.foto_url} alt={artist.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            {artist.nome[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{artist.nome}</p>
                        <p className="text-xs text-muted-foreground">{artist.quantidade} gorjetas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatCurrency(artist.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
