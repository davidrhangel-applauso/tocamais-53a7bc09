import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ListMusic, Plus, Pencil, Trash2, Music, Check, Radio, Copy, Zap } from "lucide-react";
import { toast } from "sonner";
import { SetlistMusicSelector } from "./SetlistMusicSelector";

interface Setlist {
  id: string;
  nome: string;
  descricao: string | null;
  ativa: boolean;
  created_at: string;
}

interface SetlistWithCount extends Setlist {
  musicas_count: number;
}

interface SetlistManagerProps {
  artistaId: string;
}

export function SetlistManager({ artistaId }: SetlistManagerProps) {
  const [setlists, setSetlists] = useState<SetlistWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);
  const [formData, setFormData] = useState({ nome: "", descricao: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSetlists();
  }, [artistaId]);

  const loadSetlists = async () => {
    try {
      // Load setlists
      const { data: setlistsData, error: setlistsError } = await supabase
        .from("setlists")
        .select("*")
        .eq("artista_id", artistaId)
        .order("created_at", { ascending: false });

      if (setlistsError) throw setlistsError;

      // Load music counts for each setlist
      const setlistsWithCounts: SetlistWithCount[] = await Promise.all(
        (setlistsData || []).map(async (setlist) => {
          const { count } = await supabase
            .from("setlist_musicas")
            .select("*", { count: "exact", head: true })
            .eq("setlist_id", setlist.id);

          return {
            ...setlist,
            musicas_count: count || 0,
          };
        })
      );

      // Sort: active setlist first, then by created_at
      setlistsWithCounts.sort((a, b) => {
        if (a.ativa && !b.ativa) return -1;
        if (!a.ativa && b.ativa) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setSetlists(setlistsWithCounts);
    } catch (error) {
      console.error("Erro ao carregar setlists:", error);
      toast.error("Erro ao carregar setlists");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetlist = async () => {
    if (!formData.nome.trim()) {
      toast.error("Digite um nome para a setlist");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("setlists").insert({
        artista_id: artistaId,
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
      });

      if (error) throw error;

      toast.success("Setlist criada!");
      setFormData({ nome: "", descricao: "" });
      setOpenCreateDialog(false);
      loadSetlists();
    } catch (error: any) {
      console.error("Erro ao criar setlist:", error);
      toast.error("Erro ao criar setlist");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSetlist = async () => {
    if (!selectedSetlist || !formData.nome.trim()) {
      toast.error("Digite um nome para a setlist");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("setlists")
        .update({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || null,
        })
        .eq("id", selectedSetlist.id);

      if (error) throw error;

      toast.success("Setlist atualizada!");
      setOpenEditDialog(false);
      setSelectedSetlist(null);
      loadSetlists();
    } catch (error: any) {
      console.error("Erro ao atualizar setlist:", error);
      toast.error("Erro ao atualizar setlist");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSetlist = async (setlistId: string) => {
    try {
      const { error } = await supabase
        .from("setlists")
        .delete()
        .eq("id", setlistId);

      if (error) throw error;

      toast.success("Setlist removida!");
      loadSetlists();
    } catch (error: any) {
      console.error("Erro ao remover setlist:", error);
      toast.error("Erro ao remover setlist");
    }
  };

  const handleToggleActive = async (setlist: SetlistWithCount) => {
    try {
      const { error } = await supabase
        .from("setlists")
        .update({ ativa: !setlist.ativa })
        .eq("id", setlist.id);

      if (error) throw error;

      toast.success(setlist.ativa ? "Setlist desativada" : "Setlist ativada!");
      loadSetlists();
    } catch (error: any) {
      console.error("Erro ao ativar/desativar setlist:", error);
      toast.error("Erro ao alterar status da setlist");
    }
  };

  const handleDuplicateSetlist = async (setlist: SetlistWithCount) => {
    setSaving(true);
    try {
      // Create new setlist
      const { data: newSetlist, error: insertError } = await supabase
        .from("setlists")
        .insert({
          artista_id: artistaId,
          nome: `${setlist.nome} (cópia)`,
          descricao: setlist.descricao,
          ativa: false, // New copy is inactive
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Copy musics
      const { data: musicasData } = await supabase
        .from("setlist_musicas")
        .select("musica_id, ordem")
        .eq("setlist_id", setlist.id);

      if (musicasData && musicasData.length > 0) {
        const newMusicasData = musicasData.map(m => ({
          setlist_id: newSetlist.id,
          musica_id: m.musica_id,
          ordem: m.ordem,
        }));

        const { error: musicasError } = await supabase
          .from("setlist_musicas")
          .insert(newMusicasData);

        if (musicasError) throw musicasError;
      }

      toast.success("Setlist duplicada!");
      loadSetlists();
    } catch (error: any) {
      console.error("Erro ao duplicar setlist:", error);
      toast.error("Erro ao duplicar setlist");
    } finally {
      setSaving(false);
    }
  };

  const openEditMode = (setlist: Setlist) => {
    setSelectedSetlist(setlist);
    setFormData({ nome: setlist.nome, descricao: setlist.descricao || "" });
    setOpenEditDialog(true);
  };

  const activeSetlist = setlists.find(s => s.ativa);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Carregando...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with active setlist indicator */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Minhas Setlists</CardTitle>
            </div>
            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Setlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Setlist</DialogTitle>
                  <DialogDescription>
                    Crie uma nova setlist para organizar seu repertório por ocasião.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome da Setlist *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(f => ({ ...f, nome: e.target.value }))}
                      placeholder="Ex: Sertanejo Bar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição (opcional)</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(f => ({ ...f, descricao: e.target.value }))}
                      placeholder="Ex: Músicas para bares e baladas"
                    />
                  </div>
                  <Button onClick={handleCreateSetlist} disabled={saving} className="w-full">
                    {saving ? "Criando..." : "Criar Setlist"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Organize seu repertório em diferentes listas para cada ocasião
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Active setlist indicator */}
          {activeSetlist ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Radio className="h-5 w-5 text-primary animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium">Setlist ativa: <span className="text-primary">{activeSetlist.nome}</span></p>
                <p className="text-xs text-muted-foreground">
                  Clientes verão apenas as {activeSetlist.musicas_count} músicas desta setlist
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <Music className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Repertório completo</p>
                <p className="text-xs text-muted-foreground">
                  Clientes verão todas as músicas do seu repertório
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List of setlists */}
      {setlists.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <ListMusic className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhuma setlist criada</p>
            <p className="text-sm">Crie setlists para organizar seu repertório por ocasião</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {setlists.map((setlist) => (
            <Card 
              key={setlist.id} 
              className={`transition-all ${setlist.ativa 
                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                : 'hover:border-border/80'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Quick activate button */}
                  <Button
                    variant={setlist.ativa ? "default" : "outline"}
                    size="icon"
                    className={`h-10 w-10 shrink-0 ${setlist.ativa 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'hover:border-primary hover:text-primary'}`}
                    onClick={() => handleToggleActive(setlist)}
                  >
                    {setlist.ativa ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Zap className="h-5 w-5" />
                    )}
                  </Button>

                  {/* Setlist info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{setlist.nome}</h3>
                      {setlist.ativa && (
                        <Badge className="bg-primary/20 text-primary border-0 text-xs shrink-0">
                          <Radio className="h-3 w-3 mr-1 animate-pulse" />
                          Ativa
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{setlist.musicas_count} músicas</span>
                      {setlist.descricao && (
                        <>
                          <span>•</span>
                          <span className="truncate">{setlist.descricao}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <SetlistMusicSelector
                      setlistId={setlist.id}
                      setlistName={setlist.nome}
                      artistaId={artistaId}
                      onUpdate={loadSetlists}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicateSetlist(setlist)}
                      disabled={saving}
                      className="h-8 w-8"
                      title="Duplicar setlist"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditMode(setlist)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Setlist</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover a setlist "{setlist.nome}"? 
                            As músicas não serão removidas do repertório.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSetlist(setlist.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Setlist</DialogTitle>
            <DialogDescription>
              Altere o nome ou descrição da setlist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome da Setlist *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Sertanejo Bar"
              />
            </div>
            <div>
              <Label htmlFor="edit-descricao">Descrição (opcional)</Label>
              <Input
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Músicas para bares e baladas"
              />
            </div>
            <Button onClick={handleUpdateSetlist} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
