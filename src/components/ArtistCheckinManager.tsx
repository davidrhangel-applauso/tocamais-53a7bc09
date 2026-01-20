import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Building2, MapPin, Search, LogIn, LogOut, Clock, Music } from "lucide-react";
import { useArtistCheckin, useArtistEstabelecimentoPedidos } from "@/hooks/useEstabelecimento";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ArtistCheckinManagerProps {
  artistaId: string;
  onPedidosCount?: (count: number) => void;
}

interface Estabelecimento {
  id: string;
  nome: string;
  foto_url: string | null;
  cidade: string | null;
  tipo_estabelecimento: string | null;
}

export const ArtistCheckinManager = ({ artistaId, onPedidosCount }: ArtistCheckinManagerProps) => {
  const { activeCheckin, loading, doCheckin, doCheckout, refetch } = useArtistCheckin(artistaId);
  const { pedidosPendentes } = useArtistEstabelecimentoPedidos(activeCheckin?.checkin_id || null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // Notify parent about pending pedidos count
  useEffect(() => {
    if (onPedidosCount) {
      onPedidosCount(pedidosPendentes.length);
    }
  }, [pedidosPendentes.length, onPedidosCount]);

  useEffect(() => {
    const searchEstabelecimentos = async () => {
      if (searchQuery.length < 2) {
        setEstabelecimentos([]);
        return;
      }

      setSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome, foto_url, cidade, tipo_estabelecimento')
          .eq('tipo', 'estabelecimento')
          .ilike('nome', `%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setEstabelecimentos(data || []);
      } catch (error) {
        console.error('Error searching estabelecimentos:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchEstabelecimentos, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleCheckin = async (estabelecimentoId: string) => {
    setCheckingIn(true);
    try {
      const result = await doCheckin(estabelecimentoId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Check-in realizado com sucesso!");
        setDialogOpen(false);
        setSearchQuery("");
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckout = async () => {
    const result = await doCheckout();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Check-out realizado!");
    }
  };

  if (loading) {
    return null;
  }

  if (activeCheckin) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-green-600" />
            Tocando em
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{activeCheckin.estabelecimento_nome}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Desde {format(new Date(activeCheckin.inicio), "HH:mm", { locale: ptBR })}
                  {' • '}
                  {formatDistanceToNow(new Date(activeCheckin.inicio), { locale: ptBR })}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCheckout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
            {pedidosPendentes.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg animate-pulse">
                <Music className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {pedidosPendentes.length} {pedidosPendentes.length === 1 ? 'pedido pendente' : 'pedidos pendentes'}
                </span>
                <Badge variant="default" className="ml-auto">
                  Ver na aba "Pedidos do Local"
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Fazer Check-in</p>
                  <p className="text-sm text-muted-foreground">
                    Toque para entrar em um estabelecimento
                  </p>
                </div>
              </div>
              <LogIn className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fazer Check-in</DialogTitle>
          <DialogDescription>
            Busque o estabelecimento onde você vai tocar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar estabelecimento..."
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-64">
            {searching ? (
              <div className="text-center py-8 text-muted-foreground">
                Buscando...
              </div>
            ) : estabelecimentos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery.length < 2 
                  ? "Digite para buscar" 
                  : "Nenhum estabelecimento encontrado"}
              </div>
            ) : (
              <div className="space-y-2">
                {estabelecimentos.map((estab) => (
                  <Card 
                    key={estab.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleCheckin(estab.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={estab.foto_url || undefined} />
                          <AvatarFallback>
                            <Building2 className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{estab.nome}</p>
                          <div className="flex items-center gap-2">
                            {estab.tipo_estabelecimento && (
                              <Badge variant="secondary" className="text-xs">
                                {estab.tipo_estabelecimento.replace('_', ' ')}
                              </Badge>
                            )}
                            {estab.cidade && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {estab.cidade}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
