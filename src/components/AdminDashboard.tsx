import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Crown, DollarSign, Radio, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalArtists: number;
  totalEstabelecimentos: number;
  artistsOnline: number;
  pendingSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    created_at: string;
  }>;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalArtists: 0,
    totalEstabelecimentos: 0,
    artistsOnline: 0,
    pendingSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Fetch artists count
      const { count: artistCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "artista");

      // Fetch estabelecimentos count
      const { count: estabCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "estabelecimento");

      // Fetch artists online
      const { count: onlineCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "artista")
        .eq("ativo_ao_vivo", true);

      // Fetch pending subscriptions (receipts pending review)
      const { count: pendingCount } = await supabase
        .from("subscription_receipts")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch active subscriptions
      const { count: activeCount } = await supabase
        .from("artist_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch monthly revenue (current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyData } = await supabase
        .from("artist_subscriptions")
        .select("valor")
        .eq("status", "active")
        .gte("created_at", startOfMonth.toISOString());

      const monthlyRevenue = monthlyData?.reduce((acc, sub) => acc + (sub.valor || 0), 0) || 0;

      // Fetch recent activity (new artists, new subscriptions)
      const { data: recentArtists } = await supabase
        .from("profiles")
        .select("id, nome, created_at")
        .eq("tipo", "artista")
        .order("created_at", { ascending: false })
        .limit(5);

      const recentActivity = (recentArtists || []).map(artist => ({
        id: artist.id,
        type: "new_artist",
        message: `Novo artista: ${artist.nome}`,
        created_at: artist.created_at || "",
      }));

      setStats({
        totalArtists: artistCount || 0,
        totalEstabelecimentos: estabCount || 0,
        artistsOnline: onlineCount || 0,
        pendingSubscriptions: pendingCount || 0,
        activeSubscriptions: activeCount || 0,
        monthlyRevenue,
        recentActivity,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pending Subscriptions - Priority Alert */}
        {stats.pendingSubscriptions > 0 && (
          <Card className="border-amber-500 bg-amber-500/10 col-span-full">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-amber-600">
                <Clock className="w-4 h-4" />
                Ação Necessária
              </CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {stats.pendingSubscriptions}
                <span className="text-lg font-normal text-amber-600">
                  assinatura{stats.pendingSubscriptions !== 1 ? "s" : ""} aguardando aprovação
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total de Artistas
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalArtists}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Estabelecimentos
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalEstabelecimentos}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-live" />
              Ao Vivo Agora
            </CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {stats.artistsOnline}
              {stats.artistsOnline > 0 && (
                <span className="w-2 h-2 rounded-full bg-live animate-pulse" />
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Assinaturas Ativas
            </CardDescription>
            <CardTitle className="text-3xl">{stats.activeSubscriptions}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              Receita do Mês
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              R$ {stats.monthlyRevenue.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atividade Recente</CardTitle>
          <CardDescription>Últimos cadastros na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma atividade recente</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {activity.type === "new_artist" ? "Novo Artista" : "Evento"}
                    </Badge>
                    <span className="text-sm">{activity.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.created_at
                      ? format(new Date(activity.created_at), "dd/MM HH:mm", { locale: ptBR })
                      : "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
