import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Musica {
  id: string;
  titulo: string;
  artista_original: string | null;
}

interface MusicRepertoireProps {
  artistaId: string;
}

export default function MusicRepertoire({ artistaId }: MusicRepertoireProps) {
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [novaMusica, setNovaMusica] = useState({
    titulo: "",
    artista_original: "",
  });

  useEffect(() => {
    loadMusicas();
  }, [artistaId]);

  const loadMusicas = async () => {
    const { data, error } = await supabase
      .from("musicas_repertorio")
      .select("*")
      .eq("artista_id", artistaId)
      .order("titulo", { ascending: true });

    if (error) {
      console.error("Erro ao carregar músicas:", error);
      toast.error("Erro ao carregar repertório");
    } else {
      setMusicas(data || []);
    }
    setLoading(false);
  };

  const handleAddMusica = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaMusica.titulo.trim()) {
      toast.error("Digite o título da música");
      return;
    }

    const { error } = await supabase.from("musicas_repertorio").insert({
      artista_id: artistaId,
      titulo: novaMusica.titulo.trim(),
      artista_original: novaMusica.artista_original.trim() || null,
    });

    if (error) {
      console.error("Erro ao adicionar música:", error);
      toast.error("Erro ao adicionar música");
    } else {
      toast.success("Música adicionada!");
      setNovaMusica({ titulo: "", artista_original: "" });
      setOpenDialog(false);
      loadMusicas();
    }
  };

  const handleDeleteMusica = async (id: string) => {
    const { error } = await supabase
      .from("musicas_repertorio")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao remover música:", error);
      toast.error("Erro ao remover música");
    } else {
      toast.success("Música removida!");
      loadMusicas();
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <Card className="p-4 sm:p-6">
      {/* Header - stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-semibold">Meu Repertório</h3>
          <span className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {musicas.length} {musicas.length === 1 ? 'música' : 'músicas'}
          </span>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Música</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMusica} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título da Música *</Label>
                <Input
                  id="titulo"
                  value={novaMusica.titulo}
                  onChange={(e) =>
                    setNovaMusica({ ...novaMusica, titulo: e.target.value })
                  }
                  placeholder="Ex: Evidências"
                  required
                />
              </div>
              <div>
                <Label htmlFor="artista">Artista Original</Label>
                <Input
                  id="artista"
                  value={novaMusica.artista_original}
                  onChange={(e) =>
                    setNovaMusica({
                      ...novaMusica,
                      artista_original: e.target.value,
                    })
                  }
                  placeholder="Ex: Chitãozinho & Xororó"
                />
              </div>
              <Button type="submit" className="w-full">
                Adicionar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {musicas.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <Music className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm sm:text-base">Nenhuma música no repertório</p>
          <p className="text-xs sm:text-sm">Adicione músicas para facilitar os pedidos</p>
        </div>
      ) : (
        <ScrollArea className="h-[50vh] sm:h-[400px] -mx-4 sm:mx-0 px-4 sm:px-0 sm:pr-4">
          <div className="space-y-1.5 sm:space-y-2">
            {musicas.map((musica) => (
              <div
                key={musica.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-medium text-sm sm:text-base truncate">{musica.titulo}</p>
                  {musica.artista_original && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {musica.artista_original}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMusica(musica.id)}
                  className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 shrink-0 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
