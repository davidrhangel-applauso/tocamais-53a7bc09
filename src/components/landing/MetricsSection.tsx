import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SocialShareButtons } from "@/components/landing/SocialShareButtons";

export function MetricsSection() {
  const [metrics, setMetrics] = useState({
    totalGorjetas: 0,
    artistasCount: 0,
    clientesCount: 0,
    averageRating: 0,
    loadingG: true,
    loadingA: true,
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Buscar total de gorjetas (apenas aprovadas/paid)
      const { data: gorjetasData, error: gorjetasError } = await supabase
        .from("gorjetas")
        .select("valor")
        .eq("status_pagamento", "approved");

      if (gorjetasError) throw gorjetasError;

      const totalGorjetas = gorjetasData?.reduce(
        (sum, g) => sum + (g.valor || 0),
        0
      ) || 0;

      // Buscar contagem de artistas (tipo = 'artista')
      const { count: artistasCount, error: artistasError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "artista");

      if (artistasError) throw artistasError;

      // Buscar contagem de clientes (tipo = 'cliente')
      const { count: clientesCount, error: clientesError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "cliente");

      if (clientesError) throw clientesError;

      // Buscar rating médio das avaliações
      const { data: avaliacoes, error: avaliacoesError } = await supabase
        .from("avaliacoes_artistas")
        .select("nota");

      if (avaliacoesError) throw avaliacoesError;

      const averageRating =
        avaliacoes && avaliacoes.length > 0
          ? (
              avaliacoes.reduce((sum, a) => sum + (a.nota || 0), 0) /
              avaliacoes.length
            ).toFixed(1)
          : "4.8";

      setMetrics({
        totalGorjetas,
        artistasCount: artistasCount || 0,
        clientesCount: clientesCount || 0,
        averageRating: parseFloat(averageRating),
        loadingG: false,
        loadingA: false,
      });
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
      setMetrics((prev) => ({ ...prev, loadingG: false, loadingA: false }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-primary/5 to-accent/5 border-y border-primary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Compartilhe com seus amigos músicos!
            </h3>
            <p className="text-sm text-muted-foreground">
              Conhece alguém que deveria ganhar mais gorjetas?
            </p>
          </div>
          <SocialShareButtons />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Gorjetas Totais */}
          <div className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
              {metrics.loadingG ? "..." : formatCurrency(metrics.totalGorjetas)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              em gorjetas distribuídas
            </p>
          </div>

          {/* Artistas */}
          <div className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent mb-2">
              {metrics.loadingA ? "..." : metrics.artistasCount.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              artistas cadastrados
            </p>
          </div>

          {/* Clientes */}
          <div className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-glow mb-2">
              {metrics.loadingA ? "..." : metrics.clientesCount.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              fãs e clientes
            </p>
          </div>

          {/* Rating */}
          <div className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-400 mb-2">
              {metrics.averageRating}★
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              nota dos artistas
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
