import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, Trash2, Shield, ArrowLeft, Users, Music, RefreshCw, Eye, BarChart3 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { AdminPaymentStats } from "@/components/AdminPaymentStats";
type MusicStyle = Database["public"]["Enums"]["music_style"];
type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];

interface Artist {
  id: string;
  nome: string;
  cidade: string | null;
  estilo_musical: MusicStyle | null;
  foto_url: string | null;
  plano: SubscriptionPlan;
  ativo_ao_vivo: boolean | null;
  created_at: string | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Acesso negado. Você não tem permissão de administrador.");
      navigate("/home");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchArtists();
    }
  }, [isAdmin]);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, cidade, estilo_musical, foto_url, plano, ativo_ao_vivo, created_at")
        .eq("tipo", "artista")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast.error("Erro ao carregar artistas");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArtist = async (artist: Artist) => {
    setDeleting(true);
    try {
      // Delete related data first (in order due to foreign keys)
      await supabase.from("gorjetas").delete().eq("artista_id", artist.id);
      await supabase.from("pedidos").delete().eq("artista_id", artist.id);
      await supabase.from("mensagens").delete().or(`remetente_id.eq.${artist.id},destinatario_id.eq.${artist.id}`);
      await supabase.from("notificacoes").delete().eq("usuario_id", artist.id);
      await supabase.from("musicas_repertorio").delete().eq("artista_id", artist.id);
      await supabase.from("artist_pix_info").delete().eq("artist_id", artist.id);
      await supabase.from("artist_mercadopago_credentials").delete().eq("artist_id", artist.id);
      await supabase.from("artist_subscriptions").delete().eq("artista_id", artist.id);
      
      // Finally delete the profile
      const { error } = await supabase.from("profiles").delete().eq("id", artist.id);
      
      if (error) throw error;
      
      toast.success(`Artista "${artist.nome}" excluído com sucesso`);
      setArtists(artists.filter(a => a.id !== artist.id));
      setArtistToDelete(null);
    } catch (error) {
      console.error("Error deleting artist:", error);
      toast.error("Erro ao excluir artista");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdatePlan = async (artistId: string, newPlan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ plano: newPlan })
        .eq("id", artistId);

      if (error) throw error;
      
      setArtists(artists.map(a => 
        a.id === artistId ? { ...a, plano: newPlan } : a
      ));
      toast.success("Plano atualizado com sucesso");
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Erro ao atualizar plano");
    }
  };

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (artist.cidade?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlan = planFilter === "all" || artist.plano === planFilter;
    return matchesSearch && matchesPlan;
  });

  const formatMusicStyle = (style: MusicStyle | null) => {
    if (!style) return "-";
    const styles: Record<string, string> = {
      rock: "Rock",
      pop: "Pop",
      jazz: "Jazz",
      blues: "Blues",
      samba: "Samba",
      mpb: "MPB",
      sertanejo: "Sertanejo",
      eletronica: "Eletrônica",
      rap: "Rap",
      funk: "Funk",
      outros: "Outros"
    };
    return styles[style] || style;
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                <p className="text-muted-foreground">Gerenciar artistas e finanças da plataforma</p>
              </div>
            </div>
          </div>
          <Button onClick={fetchArtists} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="artists" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="artists" className="gap-2">
              <Users className="w-4 h-4" />
              Artistas
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artists" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total de Artistas</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    {artists.length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Artistas PRO</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Music className="w-6 h-6 text-yellow-500" />
                    {artists.filter(a => a.plano === "pro").length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Ao Vivo Agora</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-live animate-pulse" />
                    {artists.filter(a => a.ativo_ao_vivo).length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome ou cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filtrar por plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os planos</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">PRO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Artists Table */}
            <Card>
              <CardHeader>
                <CardTitle>Artistas ({filteredArtists.length})</CardTitle>
                <CardDescription>Lista de todos os artistas cadastrados na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredArtists.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum artista encontrado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Artista</TableHead>
                          <TableHead>Cidade</TableHead>
                          <TableHead>Estilo</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArtists.map((artist) => (
                          <TableRow key={artist.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={artist.foto_url || undefined} />
                                  <AvatarFallback>{artist.nome[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{artist.nome}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {artist.id}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{artist.cidade || "-"}</TableCell>
                            <TableCell>{formatMusicStyle(artist.estilo_musical)}</TableCell>
                            <TableCell>
                              <Select
                                value={artist.plano}
                                onValueChange={(value) => handleUpdatePlan(artist.id, value as SubscriptionPlan)}
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="pro">PRO</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {artist.ativo_ao_vivo ? (
                                <Badge className="bg-live/20 text-live border-live/30">
                                  <span className="w-2 h-2 rounded-full bg-live mr-1.5 animate-pulse" />
                                  Ao Vivo
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Offline</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/artista/${artist.id}`)}
                                  title="Ver perfil"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => setArtistToDelete(artist)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir Artista</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir o artista "{artist.nome}"? 
                                        Esta ação é irreversível e irá excluir todos os dados relacionados 
                                        (gorjetas, pedidos, mensagens, repertório, etc).
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteArtist(artist)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={deleting}
                                      >
                                        {deleting ? "Excluindo..." : "Excluir"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro">
            <AdminPaymentStats />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
