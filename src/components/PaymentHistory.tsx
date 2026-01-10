import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Calendar, Filter, Search, Music, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface PaymentHistoryProps {
  gorjetas: Gorjeta[];
}

const PaymentHistory = ({ gorjetas }: PaymentHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "value">("date");

  // Filtrar e ordenar gorjetas
  const filteredGorjetas = gorjetas
    .filter((g) => {
      // Filtro por status
      if (filterStatus !== "all" && g.status_pagamento !== filterStatus) return false;
      
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const clienteName = g.profiles?.nome || g.cliente_nome || "Anônimo";
        const musicName = g.pedido_musica || "";
        return (
          clienteName.toLowerCase().includes(searchLower) ||
          musicName.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return b.valor_liquido_artista - a.valor_liquido_artista;
      }
    });

  // Calcular totais
  const totalRecebido = gorjetas
    .filter(g => g.status_pagamento === "approved")
    .reduce((sum, g) => sum + g.valor_liquido_artista, 0);
  
  const totalPendente = gorjetas
    .filter(g => g.status_pagamento === "pending")
    .reduce((sum, g) => sum + g.valor_liquido_artista, 0);

  const totalGorjetas = gorjetas.filter(g => g.status_pagamento === "approved").length;

  const getStatusBadge = (status: string, compact = false) => {
    const size = compact ? "text-[10px] px-1.5 py-0" : "";
    switch (status) {
      case "approved":
        return <Badge className={`bg-green-500/10 text-green-500 hover:bg-green-500/20 ${size}`}>
          {compact ? "✓" : "Aprovado"}
        </Badge>;
      case "pending":
        return <Badge variant="outline" className={`text-yellow-600 ${size}`}>
          {compact ? "⏳" : "Pendente"}
        </Badge>;
      case "rejected":
        return <Badge variant="destructive" className={size}>
          {compact ? "✗" : "Recusado"}
        </Badge>;
      default:
        return <Badge variant="secondary" className={size}>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cards de Resumo - Mobile Optimized */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:pb-3 sm:p-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-green-500" />
              <CardDescription className="text-[10px] sm:text-sm truncate">Recebido</CardDescription>
            </div>
            <CardTitle className="text-base sm:text-2xl text-green-500">
              <span className="text-xs sm:text-base">R$</span> {totalRecebido.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:pb-3 sm:p-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <Calendar className="w-3 h-3 sm:w-5 sm:h-5 text-primary" />
              <CardDescription className="text-[10px] sm:text-sm truncate">Gorjetas</CardDescription>
            </div>
            <CardTitle className="text-base sm:text-2xl text-primary">
              {totalGorjetas}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:pb-3 sm:p-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <DollarSign className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-500" />
              <CardDescription className="text-[10px] sm:text-sm truncate">Pendente</CardDescription>
            </div>
            <CardTitle className="text-base sm:text-2xl text-yellow-500">
              <span className="text-xs sm:text-base">R$</span> {totalPendente.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros e Busca - Mobile Optimized */}
      <Card>
        <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-xl">Histórico</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Suas gorjetas recebidas</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente ou música..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Filtros em linha */}
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="flex-1 h-9 text-xs sm:text-sm">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="rejected">Recusados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "value")}>
              <SelectTrigger className="flex-1 h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Recentes</SelectItem>
                <SelectItem value="value">Maior valor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Gorjetas - Mobile Optimized */}
          <div className="space-y-2 sm:space-y-3 max-h-[500px] sm:max-h-[600px] overflow-y-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            {filteredGorjetas.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm">Nenhuma gorjeta encontrada</p>
              </div>
            ) : (
              filteredGorjetas.map((gorjeta) => {
                const clienteName = gorjeta.profiles?.nome || gorjeta.cliente_nome || "Anônimo";
                const photoUrl = gorjeta.profiles?.foto_url;
                const isPro = gorjeta.taxa_plataforma === 0;

                return (
                  <Card key={gorjeta.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-3 sm:p-4">
                      {/* Mobile Layout */}
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 sm:w-11 sm:h-11 shrink-0">
                          <AvatarImage src={photoUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {clienteName[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          {/* Header Row */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{clienteName}</p>
                              <span className="sm:hidden">{getStatusBadge(gorjeta.status_pagamento, true)}</span>
                              <span className="hidden sm:inline">{getStatusBadge(gorjeta.status_pagamento)}</span>
                            </div>
                            <p className="text-base sm:text-lg font-bold text-green-500 shrink-0">
                              R$ {gorjeta.valor_liquido_artista.toFixed(2)}
                            </p>
                          </div>
                          
                          {/* Date & Details */}
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] sm:text-xs text-muted-foreground">
                              {format(new Date(gorjeta.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                              {isPro ? (
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0 border-amber-500/50 text-amber-600">
                                  PIX Direto
                                </Badge>
                              ) : (
                                <span>Taxa: R${gorjeta.taxa_plataforma.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Music Info */}
                          {gorjeta.pedido_musica && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Music className="w-3 h-3 text-primary shrink-0" />
                              <p className="text-xs text-muted-foreground truncate">
                                {gorjeta.pedido_musica}
                              </p>
                            </div>
                          )}
                          
                          {/* Message */}
                          {gorjeta.pedido_mensagem && (
                            <p className="text-[11px] text-muted-foreground italic line-clamp-1 mt-1">
                              "{gorjeta.pedido_mensagem}"
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;
