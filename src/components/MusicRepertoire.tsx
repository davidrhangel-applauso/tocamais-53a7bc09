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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Meu Repertório</h3>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Música
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Música ao Repertório</DialogTitle>
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
        <div className="text-center py-8 text-muted-foreground">
          <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma música no repertório ainda</p>
          <p className="text-sm">Adicione músicas para facilitar os pedidos dos clientes</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {musicas.map((musica) => (
              <div
                key={musica.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{musica.titulo}</p>
                  {musica.artista_original && (
                    <p className="text-sm text-muted-foreground">
                      {musica.artista_original}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMusica(musica.id)}
                  className="text-destructive hover:text-destructive"
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
