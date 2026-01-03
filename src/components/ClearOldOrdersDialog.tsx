import { useState } from "react";
import { Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useArchiveOldPedidos, useArchivedPedidos, useRestorePedidos, type Pedido } from "@/hooks/useArtistPedidos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClearOldOrdersDialogProps {
  artistId: string;
  counts: {
    concluidos: number;
    recusados: number;
  };
}

export function ClearOldOrdersDialog({ artistId, counts }: ClearOldOrdersDialogProps) {
  const [open, setOpen] = useState(false);
  const [olderThanDays, setOlderThanDays] = useState("7");
  const [includeConcluidos, setIncludeConcluidos] = useState(true);
  const [includeRecusados, setIncludeRecusados] = useState(true);
  const [selectedToRestore, setSelectedToRestore] = useState<string[]>([]);
  
  const archiveOldPedidos = useArchiveOldPedidos();
  const restorePedidos = useRestorePedidos();
  const { data: archivedPedidos = [], isLoading: loadingArchived } = useArchivedPedidos(artistId);

  const handleArchive = async () => {
    const statuses: string[] = [];
    if (includeConcluidos) statuses.push("concluido");
    if (includeRecusados) statuses.push("recusado");

    if (statuses.length === 0) return;

    await archiveOldPedidos.mutateAsync({
      artistId,
      olderThanDays: parseInt(olderThanDays),
      statuses,
    });
  };

  const handleRestore = async () => {
    if (selectedToRestore.length === 0) return;
    await restorePedidos.mutateAsync({ pedidoIds: selectedToRestore });
    setSelectedToRestore([]);
  };

  const handleRestoreAll = async () => {
    const allIds = archivedPedidos.map(p => p.id);
    if (allIds.length === 0) return;
    await restorePedidos.mutateAsync({ pedidoIds: allIds });
    setSelectedToRestore([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedToRestore(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Archive className="h-4 w-4" />
          <span className="hidden sm:inline">Arquivar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            Gerenciar Arquivamento
          </DialogTitle>
          <DialogDescription>
            Arquive pedidos antigos para manter o painel organizado. Você pode restaurá-los depois.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="archive" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="archive">Arquivar</TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              Arquivados
              {archivedPedidos.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {archivedPedidos.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="archive" className="flex-1 space-y-4 py-4">
            {/* Time filter */}
            <div className="space-y-2">
              <Label>Arquivar pedidos com mais de:</Label>
              <Select value={olderThanDays} onValueChange={setOlderThanDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 dia</SelectItem>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status filters */}
            <div className="space-y-3">
              <Label>Incluir pedidos:</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="concluidos"
                  checked={includeConcluidos}
                  onCheckedChange={(checked) => setIncludeConcluidos(!!checked)}
                />
                <label
                  htmlFor="concluidos"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Concluídos ({counts.concluidos})
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recusados"
                  checked={includeRecusados}
                  onCheckedChange={(checked) => setIncludeRecusados(!!checked)}
                />
                <label
                  htmlFor="recusados"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Recusados ({counts.recusados})
                </label>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
              <Archive className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Pedidos arquivados podem ser restaurados a qualquer momento na aba "Arquivados".
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleArchive}
              disabled={archiveOldPedidos.isPending || (!includeConcluidos && !includeRecusados)}
            >
              {archiveOldPedidos.isPending ? "Arquivando..." : "Arquivar Pedidos"}
            </Button>
          </TabsContent>

          <TabsContent value="archived" className="flex-1 overflow-hidden flex flex-col py-4">
            {loadingArchived ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : archivedPedidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Archive className="h-8 w-8 opacity-50" />
                <p className="text-sm">Nenhum pedido arquivado</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
                  {archivedPedidos.map((pedido) => (
                    <div
                      key={pedido.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedToRestore.includes(pedido.id) 
                          ? "bg-primary/10 border-primary" 
                          : "bg-card hover:bg-muted/50"
                      }`}
                      onClick={() => toggleSelect(pedido.id)}
                    >
                      <Checkbox
                        checked={selectedToRestore.includes(pedido.id)}
                        onCheckedChange={() => toggleSelect(pedido.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pedido.musica}</p>
                        <p className="text-xs text-muted-foreground">
                          {pedido.cliente_nome || pedido.profiles?.nome || "Anônimo"} • 
                          {pedido.arquivado_at && format(new Date(pedido.arquivado_at), " dd/MM", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={pedido.status === "concluido" ? "default" : "secondary"} className="shrink-0">
                        {pedido.status === "concluido" ? "✓" : "✗"}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={handleRestoreAll}
                    disabled={restorePedidos.isPending || archivedPedidos.length === 0}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restaurar Todos
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={handleRestore}
                    disabled={restorePedidos.isPending || selectedToRestore.length === 0}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restaurar ({selectedToRestore.length})
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}