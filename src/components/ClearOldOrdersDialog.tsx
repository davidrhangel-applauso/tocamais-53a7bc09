import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
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
import { useDeleteOldPedidos } from "@/hooks/useArtistPedidos";

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
  
  const deleteOldPedidos = useDeleteOldPedidos();

  const handleClear = async () => {
    const statuses: string[] = [];
    if (includeConcluidos) statuses.push("concluido");
    if (includeRecusados) statuses.push("recusado");

    if (statuses.length === 0) return;

    await deleteOldPedidos.mutateAsync({
      artistId,
      olderThanDays: parseInt(olderThanDays),
      statuses,
    });
    
    setOpen(false);
  };

  const totalToClean = (includeConcluidos ? counts.concluidos : 0) + 
                       (includeRecusados ? counts.recusados : 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Limpar Antigos</span>
          <span className="sm:hidden">Limpar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Limpar Pedidos Antigos
          </DialogTitle>
          <DialogDescription>
            Remove pedidos concluídos e recusados para manter seu painel organizado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Time filter */}
          <div className="space-y-2">
            <Label>Remover pedidos com mais de:</Label>
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

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Esta ação é irreversível. Os pedidos removidos não podem ser recuperados.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={deleteOldPedidos.isPending || (!includeConcluidos && !includeRecusados)}
          >
            {deleteOldPedidos.isPending ? "Removendo..." : "Remover Pedidos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
