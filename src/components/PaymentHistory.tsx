import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Calendar, Filter, Search } from "lucide-react";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Aprovado</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-yellow-600">Pendente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Recusado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <CardDescription>Total Recebido</CardDescription>
            </div>
            <CardTitle className="text-2xl text-green-500">
              R$ {totalRecebido.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardDescription>Total de Gorjetas</CardDescription>
            </div>
            <CardTitle className="text-2xl text-primary">
              {totalGorjetas}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <CardDescription>Pendente</CardDescription>
            </div>
            <CardTitle className="text-2xl text-yellow-500">
              R$ {totalPendente.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Visualize todas as gorjetas recebidas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou música..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro por Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="rejected">Recusados</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "value")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Mais recentes</SelectItem>
                <SelectItem value="value">Maior valor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Gorjetas */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredGorjetas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma gorjeta encontrada</p>
              </div>
            ) : (
              filteredGorjetas.map((gorjeta) => {
                const clienteName = gorjeta.profiles?.nome || gorjeta.cliente_nome || "Anônimo";
                const photoUrl = gorjeta.profiles?.foto_url;

                return (
                  <Card key={gorjeta.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarImage src={photoUrl} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {clienteName[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{clienteName}</p>
                              {getStatusBadge(gorjeta.status_pagamento)}
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>
                                {format(new Date(gorjeta.created_at), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                              {gorjeta.pedido_musica && (
                                <p className="text-xs">
                                  🎵 {gorjeta.pedido_musica}
                                </p>
                              )}
                              {gorjeta.pedido_mensagem && (
                                <p className="text-xs italic line-clamp-1">
                                  "{gorjeta.pedido_mensagem}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-green-500">
                            R$ {gorjeta.valor_liquido_artista.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Taxa: R$ {gorjeta.taxa_plataforma.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total: R$ {gorjeta.valor.toFixed(2)}
                          </p>
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
