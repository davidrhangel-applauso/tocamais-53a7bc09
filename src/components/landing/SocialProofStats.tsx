import { useEffect, useState } from "react";
import { Users, Heart, Music, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCountAnimation } from "@/hooks/useCountAnimation";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  artists: number;
  tips: number;
  requests: number;
}

const StatCard = ({
  icon: Icon,
  value,
  label,
  suffix = "+",
  isLoading,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  suffix?: string;
  isLoading: boolean;
}) => {
  const { count, ref } = useCountAnimation({ end: value, duration: 2500 });

  return (
    <div ref={ref} className="text-center group">
      <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      {isLoading ? (
        <Skeleton className="h-10 w-24 mx-auto mb-2" />
      ) : (
        <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          {count}
          {suffix}
        </div>
      )}
      <p className="text-muted-foreground text-sm sm:text-base">{label}</p>
    </div>
  );
};

export const SocialProofStats = () => {
  const [stats, setStats] = useState<Stats>({ artists: 0, tips: 0, requests: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch counts in parallel
        const [artistsResult, tipsResult, requestsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("tipo", "artista"),
          supabase
            .from("gorjetas")
            .select("id", { count: "exact", head: true })
            .eq("status_pagamento", "approved"),
          supabase.from("pedidos").select("id", { count: "exact", head: true }),
        ]);

        setStats({
          artists: artistsResult.count || 0,
          tips: tipsResult.count || 0,
          requests: requestsResult.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="py-16 sm:py-20 px-4 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto max-w-6xl">
        {/* Trust Badge */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-full shadow-lg">
            <Shield className="w-5 h-5 text-live" />
            <span className="text-sm font-medium">100% Seguro via PIX</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
          <StatCard
            icon={Users}
            value={stats.artists}
            label="Artistas cadastrados"
            isLoading={isLoading}
          />
          <StatCard
            icon={Heart}
            value={stats.tips}
            label="Gorjetas enviadas"
            isLoading={isLoading}
          />
          <StatCard
            icon={Music}
            value={stats.requests}
            label="Músicas pedidas"
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  );
};
