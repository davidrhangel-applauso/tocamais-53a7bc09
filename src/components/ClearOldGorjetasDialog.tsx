import { useState } from "react";
import { Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useArchiveOldGorjetas, useArchivedGorjetas, useRestoreGorjetas, type Gorjeta } from "@/hooks/useArtistGorjetas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClearOldGorjetasDialogProps {
  artistId: string;
  counts: {
    aprovadas: number;
    pendentes: number;
  };
}

export function ClearOldGorjetasDialog({ artistId, counts }: ClearOldGorjetasDialogProps) {
  const [open, setOpen] = useState(false);
  const [olderThanDays, setOlderThanDays] = useState("7");
  const [includeAprovadas, setIncludeAprovadas] = useState(true);
  const [includePendentes, setIncludePendentes] = useState(false);
  const [selectedToRestore, setSelectedToRestore] = useState<string[]>([]);
  
  const archiveOldGorjetas = useArchiveOldGorjetas();
  const restoreGorjetas = useRestoreGorjetas();
  const { data: archivedGorjetas = [], isLoading: loadingArchived } = useArchivedGorjetas(artistId);

  const handleArchive = async () => {
    const statuses: string[] = [];
    if (includeAprovadas) statuses.push("approved");
    if (includePendentes) statuses.push("pending");

    if (statuses.length === 0) return;

    await archiveOldGorjetas.mutateAsync({
      artistId,
      olderThanDays: parseInt(olderThanDays),
      statuses,
    });
  };

  const handleRestore = async () => {
    if (selectedToRestore.length === 0) return;
    await restoreGorjetas.mutateAsync({ gorjetaIds: selectedToRestore });
    setSelectedToRestore([]);
  };

  const handleRestoreAll = async () => {
    const allIds = archivedGorjetas.map(g => g.id);
    if (allIds.length === 0) return;
    await restoreGorjetas.mutateAsync({ gorjetaIds: allIds });
    setSelectedToRestore([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedToRestore(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600">✓</Badge>;
      case "pending":
        return <Badge variant="secondary">⏳</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Archive className="h-4 w-4" />
          <span className="hidden sm:inline">Arquivar Gorjetas</span>
          <span className="sm:hidden text-xs">Arquivo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            Gerenciar Arquivamento de Gorjetas
          </DialogTitle>
          <DialogDescription>
            Arquive gorjetas antigas para manter o histórico organizado. Você pode restaurá-las depois.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="archive" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="archive">Arquivar</TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              Arquivadas
              {archivedGorjetas.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {archivedGorjetas.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="archive" className="flex-1 space-y-4 py-4">
            {/* Time filter */}
            <div className="space-y-2">
              <Label>Arquivar gorjetas com mais de:</Label>
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
              <Label>Incluir gorjetas:</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aprovadas"
                  checked={includeAprovadas}
                  onCheckedChange={(checked) => setIncludeAprovadas(!!checked)}
                />
                <label
                  htmlFor="aprovadas"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aprovadas ({counts.aprovadas})
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pendentes"
                  checked={includePendentes}
                  onCheckedChange={(checked) => setIncludePendentes(!!checked)}
                />
                <label
                  htmlFor="pendentes"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Pendentes ({counts.pendentes})
                </label>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
              <Archive className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Gorjetas arquivadas podem ser restauradas a qualquer momento na aba "Arquivadas".
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleArchive}
              disabled={archiveOldGorjetas.isPending || (!includeAprovadas && !includePendentes)}
            >
              {archiveOldGorjetas.isPending ? "Arquivando..." : "Arquivar Gorjetas"}
            </Button>
          </TabsContent>

          <TabsContent value="archived" className="flex-1 overflow-hidden flex flex-col py-4">
            {loadingArchived ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : archivedGorjetas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Archive className="h-8 w-8 opacity-50" />
                <p className="text-sm">Nenhuma gorjeta arquivada</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
                  {archivedGorjetas.map((gorjeta) => (
                    <div
                      key={gorjeta.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedToRestore.includes(gorjeta.id) 
                          ? "bg-primary/10 border-primary" 
                          : "bg-card hover:bg-muted/50"
                      }`}
                      onClick={() => toggleSelect(gorjeta.id)}
                    >
                      <Checkbox
                        checked={selectedToRestore.includes(gorjeta.id)}
                        onCheckedChange={() => toggleSelect(gorjeta.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          R$ {gorjeta.valor.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {gorjeta.cliente_nome || gorjeta.profiles?.nome || "Anônimo"} • 
                          {gorjeta.arquivado_at && format(new Date(gorjeta.arquivado_at), " dd/MM", { locale: ptBR })}
                        </p>
                        {gorjeta.pedido_musica && (
                          <p className="text-xs text-muted-foreground truncate">
                            🎵 {gorjeta.pedido_musica}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(gorjeta.status_pagamento)}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={handleRestoreAll}
                    disabled={restoreGorjetas.isPending || archivedGorjetas.length === 0}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restaurar Todos
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={handleRestore}
                    disabled={restoreGorjetas.isPending || selectedToRestore.length === 0}
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
