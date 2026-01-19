import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, Plus, Trash2, Upload, FileText, X, Search, Pencil, ListMusic } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Musica {
  id: string;
  titulo: string;
  artista_original: string | null;
}

interface MusicaWithSetlists extends Musica {
  setlists: { id: string; nome: string }[];
}

interface ParsedMusic {
  titulo: string;
  artista_original: string | null;
}

interface MusicRepertoireProps {
  artistaId: string;
}

export default function MusicRepertoire({ artistaId }: MusicRepertoireProps) {
  const [musicas, setMusicas] = useState<MusicaWithSetlists[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [editingMusica, setEditingMusica] = useState<MusicaWithSetlists | null>(null);
  const [novaMusica, setNovaMusica] = useState({
    titulo: "",
    artista_original: "",
  });
  const [editMusica, setEditMusica] = useState({
    titulo: "",
    artista_original: "",
  });
  const [editSelectedSetlists, setEditSelectedSetlists] = useState<string[]>([]);
  const [importText, setImportText] = useState("");
  const [parsedMusics, setParsedMusics] = useState<ParsedMusic[]>([]);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [artistSetlists, setArtistSetlists] = useState<{ id: string; nome: string }[]>([]);
  const [selectedSetlists, setSelectedSetlists] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMusicas();
    loadSetlists();
  }, [artistaId]);

  const loadSetlists = async () => {
    const { data } = await supabase
      .from("setlists")
      .select("id, nome")
      .eq("artista_id", artistaId)
      .order("nome");
    setArtistSetlists(data || []);
  };

  const loadMusicas = async () => {
    // Fetch musicas
    const { data: musicasData, error: musicasError } = await supabase
      .from("musicas_repertorio")
      .select("*")
      .eq("artista_id", artistaId)
      .order("titulo", { ascending: true });

    if (musicasError) {
      console.error("Erro ao carregar músicas:", musicasError);
      toast.error("Erro ao carregar repertório");
      setLoading(false);
      return;
    }

    // Fetch setlist associations for each music
    const { data: setlistMusicasData } = await supabase
      .from("setlist_musicas")
      .select("musica_id, setlist_id, setlists(id, nome)")
      .in("musica_id", musicasData?.map(m => m.id) || []);

    // Create a map of musica_id -> setlists
    const musicaSetlistsMap = new Map<string, { id: string; nome: string }[]>();
    setlistMusicasData?.forEach(sm => {
      const setlist = sm.setlists as unknown as { id: string; nome: string };
      if (setlist) {
        const existing = musicaSetlistsMap.get(sm.musica_id) || [];
        existing.push(setlist);
        musicaSetlistsMap.set(sm.musica_id, existing);
      }
    });

    // Merge musicas with their setlists
    const musicasWithSetlists: MusicaWithSetlists[] = (musicasData || []).map(m => ({
      ...m,
      setlists: musicaSetlistsMap.get(m.id) || [],
    }));

    setMusicas(musicasWithSetlists);
    setLoading(false);
  };

  const handleAddMusica = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaMusica.titulo.trim()) {
      toast.error("Digite o título da música");
      return;
    }

    const { data: musicaData, error } = await supabase
      .from("musicas_repertorio")
      .insert({
        artista_id: artistaId,
        titulo: novaMusica.titulo.trim(),
        artista_original: novaMusica.artista_original.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar música:", error);
      toast.error("Erro ao adicionar música");
      return;
    }

    // Add to selected setlists
    if (selectedSetlists.length > 0 && musicaData) {
      const setlistMusicasToInsert = selectedSetlists.map((setlistId) => ({
        setlist_id: setlistId,
        musica_id: musicaData.id,
        ordem: 0,
      }));

      const { error: setlistError } = await supabase
        .from("setlist_musicas")
        .insert(setlistMusicasToInsert);

      if (setlistError) {
        console.error("Erro ao adicionar em setlists:", setlistError);
        toast.warning("Música adicionada, mas houve erro ao incluir nas setlists");
      } else {
        toast.success(`Música adicionada em ${selectedSetlists.length} setlist(s)!`);
      }
    } else {
      toast.success("Música adicionada!");
    }

    setNovaMusica({ titulo: "", artista_original: "" });
    setSelectedSetlists([]);
    setOpenDialog(false);
    loadMusicas();
  };

  const handleEditMusica = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMusica || !editMusica.titulo.trim()) {
      toast.error("Digite o título da música");
      return;
    }

    // Update music info
    const { error } = await supabase
      .from("musicas_repertorio")
      .update({
        titulo: editMusica.titulo.trim(),
        artista_original: editMusica.artista_original.trim() || null,
      })
      .eq("id", editingMusica.id);

    if (error) {
      console.error("Erro ao editar música:", error);
      toast.error("Erro ao editar música");
      return;
    }

    // Handle setlist changes
    const currentSetlistIds = editingMusica.setlists.map(s => s.id);
    const setlistsToAdd = editSelectedSetlists.filter(id => !currentSetlistIds.includes(id));
    const setlistsToRemove = currentSetlistIds.filter(id => !editSelectedSetlists.includes(id));

    // Add to new setlists
    if (setlistsToAdd.length > 0) {
      const toInsert = setlistsToAdd.map(setlistId => ({
        setlist_id: setlistId,
        musica_id: editingMusica.id,
        ordem: 0,
      }));
      await supabase.from("setlist_musicas").insert(toInsert);
    }

    // Remove from setlists
    if (setlistsToRemove.length > 0) {
      await supabase
        .from("setlist_musicas")
        .delete()
        .eq("musica_id", editingMusica.id)
        .in("setlist_id", setlistsToRemove);
    }

    toast.success("Música atualizada!");
    setOpenEditDialog(false);
    setEditingMusica(null);
    setEditSelectedSetlists([]);
    loadMusicas();
  };

  const openEditMode = (musica: MusicaWithSetlists) => {
    setEditingMusica(musica);
    setEditMusica({
      titulo: musica.titulo,
      artista_original: musica.artista_original || "",
    });
    setEditSelectedSetlists(musica.setlists.map(s => s.id));
    setOpenEditDialog(true);
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

  const parseTextInput = (text: string): ParsedMusic[] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      // Try to detect "Title - Artist" or "Title;Artist" or just "Title"
      const separators = [' - ', ' – ', ';', ',', '\t'];
      for (const sep of separators) {
        if (line.includes(sep)) {
          const parts = line.split(sep);
          return {
            titulo: parts[0].trim(),
            artista_original: parts.slice(1).join(sep).trim() || null,
          };
        }
      }
      return { titulo: line.trim(), artista_original: null };
    }).filter(m => m.titulo.length > 0);
  };

  const parseCSV = (content: string): ParsedMusic[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const results: ParsedMusic[] = [];
    
    // Skip header if it looks like one
    const startIndex = lines[0]?.toLowerCase().includes('titulo') || 
                       lines[0]?.toLowerCase().includes('title') ||
                       lines[0]?.toLowerCase().includes('música') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Handle quoted CSV values
      const match = line.match(/^"?([^",]+)"?,\s*"?([^"]*)"?$/);
      if (match) {
        results.push({
          titulo: match[1].trim(),
          artista_original: match[2].trim() || null,
        });
      } else {
        // Fallback to simple split
        const parts = line.split(',');
        if (parts[0]?.trim()) {
          results.push({
            titulo: parts[0].trim(),
            artista_original: parts[1]?.trim() || null,
          });
        }
      }
    }
    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.csv')) {
        const parsed = parseCSV(content);
        setParsedMusics(parsed);
        toast.success(`${parsed.length} músicas encontradas no CSV`);
      } else {
        const parsed = parseTextInput(content);
        setParsedMusics(parsed);
        toast.success(`${parsed.length} músicas encontradas`);
      }
    };
    reader.readAsText(file);
  };

  const handleTextParse = () => {
    const parsed = parseTextInput(importText);
    setParsedMusics(parsed);
    if (parsed.length > 0) {
      toast.success(`${parsed.length} músicas encontradas`);
    } else {
      toast.error("Nenhuma música encontrada no texto");
    }
  };

  const handleBulkImport = async () => {
    if (parsedMusics.length === 0) {
      toast.error("Nenhuma música para importar");
      return;
    }

    setImporting(true);
    const toInsert = parsedMusics.map(m => ({
      artista_id: artistaId,
      titulo: m.titulo,
      artista_original: m.artista_original,
    }));

    const { error } = await supabase.from("musicas_repertorio").insert(toInsert);

    if (error) {
      console.error("Erro ao importar músicas:", error);
      toast.error("Erro ao importar músicas");
    } else {
      toast.success(`${parsedMusics.length} músicas importadas!`);
      setParsedMusics([]);
      setImportText("");
      setOpenImportDialog(false);
      loadMusicas();
    }
    setImporting(false);
  };

  const removeFromParsed = (index: number) => {
    setParsedMusics(prev => prev.filter((_, i) => i !== index));
  };

  // Filter musicas based on search term
  const filteredMusicas = musicas.filter(m => {
    const term = searchTerm.toLowerCase();
    return (
      m.titulo.toLowerCase().includes(term) ||
      (m.artista_original && m.artista_original.toLowerCase().includes(term))
    );
  });

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
        <div className="flex gap-2">
          {/* Import Button */}
          <Dialog open={openImportDialog} onOpenChange={(open) => {
            setOpenImportDialog(open);
            if (!open) {
              setParsedMusics([]);
              setImportText("");
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Importar Músicas em Lote</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="text" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="text-xs sm:text-sm">
                    <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                    Lista de Texto
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="text-xs sm:text-sm">
                    <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                    Arquivo CSV
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="flex-1 flex flex-col min-h-0 space-y-3">
                  <div className="space-y-2">
                    <Label>Cole sua lista de músicas</Label>
                    <Textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder={`Uma música por linha. Exemplos:\n\nEvidências - Chitãozinho & Xororó\nAi Se Eu Te Pego - Michel Teló\nMeu Abrigo\nSó Hoje`}
                      className="h-32 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: "Título - Artista", "Título; Artista" ou apenas "Título"
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleTextParse}
                    disabled={!importText.trim()}
                    size="sm"
                  >
                    Analisar Lista
                  </Button>
                </TabsContent>
                
                <TabsContent value="csv" className="flex-1 flex flex-col min-h-0 space-y-3">
                  <div className="space-y-2">
                    <Label>Envie um arquivo CSV ou TXT</Label>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      CSV com colunas: titulo, artista_original
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Preview of parsed musics */}
              {parsedMusics.length > 0 && (
                <div className="border-t pt-3 mt-3 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                      Músicas a importar ({parsedMusics.length})
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setParsedMusics([])}
                      className="text-xs h-7"
                    >
                      Limpar
                    </Button>
                  </div>
                  <ScrollArea className="max-h-40 border rounded-md">
                    <div className="p-2 space-y-1">
                      {parsedMusics.map((m, i) => (
                        <div 
                          key={i} 
                          className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50 group"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="font-medium truncate block">{m.titulo}</span>
                            {m.artista_original && (
                              <span className="text-muted-foreground truncate block">
                                {m.artista_original}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-50 hover:opacity-100"
                            onClick={() => removeFromParsed(i)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button 
                    onClick={handleBulkImport} 
                    disabled={importing}
                    className="w-full mt-3"
                  >
                    {importing ? "Importando..." : `Importar ${parsedMusics.length} músicas`}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Add Single Button */}
          <Dialog 
            open={openDialog} 
            onOpenChange={(open) => {
              setOpenDialog(open);
              if (!open) {
                setNovaMusica({ titulo: "", artista_original: "" });
                setSelectedSetlists([]);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 sm:flex-none">
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
                
                {/* Setlist selection */}
                {artistSetlists.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Adicionar em Setlists (opcional)</Label>
                    <ScrollArea className="max-h-32 border rounded-md p-3">
                      <div className="space-y-2">
                        {artistSetlists.map((setlist) => (
                          <div key={setlist.id} className="flex items-center gap-2">
                            <Checkbox 
                              id={`setlist-${setlist.id}`}
                              checked={selectedSetlists.includes(setlist.id)}
                              onCheckedChange={(checked) => {
                                setSelectedSetlists(prev => 
                                  checked 
                                    ? [...prev, setlist.id]
                                    : prev.filter(id => id !== setlist.id)
                                );
                              }}
                            />
                            <label 
                              htmlFor={`setlist-${setlist.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {setlist.nome}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                
                <Button type="submit" className="w-full">
                  Adicionar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search input */}
      {musicas.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou artista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {filteredMusicas.length} de {musicas.length}
            </div>
          )}
        </div>
      )}

      {musicas.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <Music className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm sm:text-base">Nenhuma música no repertório</p>
          <p className="text-xs sm:text-sm">Adicione músicas ou importe uma lista</p>
        </div>
      ) : filteredMusicas.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma música encontrada</p>
          <p className="text-xs">Tente outro termo de busca</p>
        </div>
      ) : (
        <div className="max-h-[50vh] sm:max-h-[400px] overflow-y-auto -mx-4 sm:mx-0 px-4 sm:px-0 sm:pr-4 overscroll-contain">
          <div className="space-y-1.5 sm:space-y-2">
            {filteredMusicas.map((musica) => (
              <div
                key={musica.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm sm:text-base truncate">{musica.titulo}</p>
                    {/* Setlist indicator */}
                    {musica.setlists.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="secondary" 
                              className="text-[10px] px-1.5 py-0 h-5 shrink-0 cursor-help"
                            >
                              <ListMusic className="h-3 w-3 mr-0.5" />
                              {musica.setlists.length}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs font-medium mb-1">Em {musica.setlists.length} setlist(s):</p>
                            <ul className="text-xs">
                              {musica.setlists.map(s => (
                                <li key={s.id}>• {s.nome}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  {musica.artista_original && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {musica.artista_original}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditMode(musica)}
                    className="h-8 w-8 sm:h-9 sm:w-9 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMusica(musica.id)}
                    className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Música</DialogTitle>
            <DialogDescription>Altere o título ou artista da música</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMusica} className="space-y-4">
            <div>
              <Label htmlFor="edit-titulo">Título da Música *</Label>
              <Input
                id="edit-titulo"
                value={editMusica.titulo}
                onChange={(e) =>
                  setEditMusica({ ...editMusica, titulo: e.target.value })
                }
                placeholder="Ex: Evidências"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-artista">Artista Original</Label>
              <Input
                id="edit-artista"
                value={editMusica.artista_original}
                onChange={(e) =>
                  setEditMusica({
                    ...editMusica,
                    artista_original: e.target.value,
                  })
                }
                placeholder="Ex: Chitãozinho & Xororó"
              />
            </div>
            
            {/* Setlist selection for edit */}
            {artistSetlists.length > 0 && (
              <div>
                <Label className="mb-2 block">Setlists</Label>
                <ScrollArea className="max-h-32 border rounded-md p-3">
                  <div className="space-y-2">
                    {artistSetlists.map((setlist) => (
                      <div key={setlist.id} className="flex items-center gap-2">
                        <Checkbox 
                          id={`edit-setlist-${setlist.id}`}
                          checked={editSelectedSetlists.includes(setlist.id)}
                          onCheckedChange={(checked) => {
                            setEditSelectedSetlists(prev => 
                              checked 
                                ? [...prev, setlist.id]
                                : prev.filter(id => id !== setlist.id)
                            );
                          }}
                        />
                        <label 
                          htmlFor={`edit-setlist-${setlist.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {setlist.nome}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <Button type="submit" className="w-full">
              Salvar Alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
