import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Music, Search, ListMusic, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Musica {
  id: string;
  titulo: string;
  artista_original: string | null;
}

interface SetlistMusicSelectorProps {
  setlistId: string;
  setlistName: string;
  artistaId: string;
  onUpdate: () => void;
  asTrigger?: boolean;
}

export function SetlistMusicSelector({ setlistId, setlistName, artistaId, onUpdate, asTrigger }: SetlistMusicSelectorProps) {
  const [open, setOpen] = useState(false);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [selectedMusicIds, setSelectedMusicIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, artistaId, setlistId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all musicas
      const { data: musicasData, error: musicasError } = await supabase
        .from("musicas_repertorio")
        .select("id, titulo, artista_original")
        .eq("artista_id", artistaId)
        .order("titulo", { ascending: true });

      if (musicasError) throw musicasError;
      setMusicas(musicasData || []);

      // Load musicas already in this setlist with order
      const { data: setlistMusicasData, error: setlistMusicasError } = await supabase
        .from("setlist_musicas")
        .select("musica_id, ordem")
        .eq("setlist_id", setlistId)
        .order("ordem", { ascending: true });

      if (setlistMusicasError) throw setlistMusicasError;

      // Preserve the order from the database
      const orderedIds = setlistMusicasData?.map(sm => sm.musica_id) || [];
      setSelectedMusicIds(orderedIds);
    } catch (error) {
      console.error("Erro ao carregar músicas:", error);
      toast.error("Erro ao carregar músicas");
    } finally {
      setLoading(false);
    }
  };

  const toggleMusica = (musicaId: string) => {
    setSelectedMusicIds(prev => {
      if (prev.includes(musicaId)) {
        return prev.filter(id => id !== musicaId);
      } else {
        return [...prev, musicaId];
      }
    });
  };

  const selectAll = () => {
    const filteredIds = filteredMusicas.map(m => m.id);
    setSelectedMusicIds(prev => {
      const newSet = new Set(prev);
      filteredIds.forEach(id => newSet.add(id));
      return Array.from(newSet);
    });
  };

  const deselectAll = () => {
    const filteredIds = new Set(filteredMusicas.map(m => m.id));
    setSelectedMusicIds(prev => prev.filter(id => !filteredIds.has(id)));
  };

  const moveUp = (musicaId: string) => {
    setSelectedMusicIds(prev => {
      const index = prev.indexOf(musicaId);
      if (index <= 0) return prev;
      const newArr = [...prev];
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      return newArr;
    });
  };

  const moveDown = (musicaId: string) => {
    setSelectedMusicIds(prev => {
      const index = prev.indexOf(musicaId);
      if (index === -1 || index >= prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      return newArr;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Remove all existing associations
      const { error: deleteError } = await supabase
        .from("setlist_musicas")
        .delete()
        .eq("setlist_id", setlistId);

      if (deleteError) throw deleteError;

      // Add new associations with order
      if (selectedMusicIds.length > 0) {
        const inserts = selectedMusicIds.map((musicaId, index) => ({
          setlist_id: setlistId,
          musica_id: musicaId,
          ordem: index,
        }));

        const { error: insertError } = await supabase
          .from("setlist_musicas")
          .insert(inserts);

        if (insertError) throw insertError;
      }

      toast.success(`${selectedMusicIds.length} músicas salvas na setlist!`);
      setOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Erro ao salvar músicas:", error);
      toast.error("Erro ao salvar músicas na setlist");
    } finally {
      setSaving(false);
    }
  };

  const filteredMusicas = musicas.filter(m => {
    const term = searchTerm.toLowerCase();
    return (
      m.titulo.toLowerCase().includes(term) ||
      (m.artista_original && m.artista_original.toLowerCase().includes(term))
    );
  });

  const allFilteredSelected = filteredMusicas.length > 0 && filteredMusicas.every(m => selectedMusicIds.includes(m.id));

  // Get ordered selected musicas for reordering section
  const selectedMusicas = selectedMusicIds
    .map(id => musicas.find(m => m.id === id))
    .filter((m): m is Musica => m !== undefined);

  const dialogContent = (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Músicas da Setlist
        </DialogTitle>
        <DialogDescription>
          Selecione e ordene as músicas para "{setlistName}"
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : musicas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Music className="h-12 w-12 mb-3 opacity-50" />
          <p>Nenhuma música no repertório</p>
          <p className="text-sm">Adicione músicas no repertório primeiro</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar música..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select all / Deselect all */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedMusicIds.length} de {musicas.length} selecionadas
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} disabled={allFilteredSelected}>
                Selecionar todas
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} disabled={selectedMusicIds.length === 0}>
                Limpar
              </Button>
            </div>
          </div>

          {/* Music list for selection */}
          <ScrollArea className="flex-1 -mx-6 px-6 max-h-[30vh]">
            <div className="space-y-1">
              {filteredMusicas.map((musica) => (
                <label
                  key={musica.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedMusicIds.includes(musica.id)}
                    onCheckedChange={() => toggleMusica(musica.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{musica.titulo}</p>
                    {musica.artista_original && (
                      <p className="text-xs text-muted-foreground truncate">
                        {musica.artista_original}
                      </p>
                    )}
                  </div>
                </label>
              ))}
              {filteredMusicas.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma música encontrada
                </p>
              )}
            </div>
          </ScrollArea>

          {/* Reorder selected musicas */}
          {selectedMusicas.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                Ordem das músicas ({selectedMusicas.length})
              </p>
              <ScrollArea className="max-h-[20vh] -mx-6 px-6">
                <div className="space-y-1">
                  {selectedMusicas.map((musica, index) => (
                    <div
                      key={musica.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <span className="text-xs text-muted-foreground w-5 text-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{musica.titulo}</p>
                        {musica.artista_original && (
                          <p className="text-xs text-muted-foreground truncate">
                            {musica.artista_original}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveUp(musica.id)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveDown(musica.id)}
                          disabled={index === selectedMusicas.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Save button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Salvando..." : `Salvar (${selectedMusicIds.length} músicas)`}
          </Button>
        </>
      )}
    </>
  );

  // If asTrigger is true, render as a menu item with separate dialog
  if (asTrigger) {
    return (
      <>
        <button
          className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <ListMusic className="h-4 w-4 mr-2" />
          Gerenciar músicas
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col">
            {dialogContent}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ListMusic className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col">
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}
