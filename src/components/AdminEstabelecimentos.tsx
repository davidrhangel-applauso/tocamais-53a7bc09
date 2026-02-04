import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Trash2, Eye, Building2, MapPin, RefreshCw } from "lucide-react";

interface Estabelecimento {
  id: string;
  nome: string;
  cidade: string | null;
  endereco: string | null;
  tipo_estabelecimento: string | null;
  foto_url: string | null;
  created_at: string | null;
}

interface EmailMap {
  [key: string]: string;
}

export function AdminEstabelecimentos() {
  const navigate = useNavigate();
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [emailMap, setEmailMap] = useState<EmailMap>({});

  useEffect(() => {
    fetchEstabelecimentos();
  }, []);

  const fetchEstabelecimentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, cidade, endereco, tipo_estabelecimento, foto_url, created_at")
        .eq("tipo", "estabelecimento")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEstabelecimentos(data || []);
      
      // Fetch emails for all estabelecimentos
      if (data && data.length > 0) {
        const userIds = data.map(e => e.id);
        const { data: emailsData, error: emailsError } = await supabase
          .rpc('get_user_emails_for_admin', { user_ids: userIds });
        
        if (!emailsError && emailsData) {
          const emails: EmailMap = {};
          emailsData.forEach((item: { user_id: string; email: string }) => {
            emails[item.user_id] = item.email;
          });
          setEmailMap(emails);
        }
      }
    } catch (error) {
      console.error("Error fetching estabelecimentos:", error);
      toast.error("Erro ao carregar estabelecimentos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (estabelecimento: Estabelecimento) => {
    setDeleting(true);
    try {
      // Delete related data first
      await supabase.from("estabelecimento_checkins").delete().eq("estabelecimento_id", estabelecimento.id);
      await supabase.from("pedidos_estabelecimento").delete().eq("estabelecimento_id", estabelecimento.id);
      await supabase.from("avaliacoes_artistas").delete().eq("estabelecimento_id", estabelecimento.id);
      await supabase.from("mensagens").delete().or(`remetente_id.eq.${estabelecimento.id},destinatario_id.eq.${estabelecimento.id}`);
      await supabase.from("notificacoes").delete().eq("usuario_id", estabelecimento.id);
      
      // Delete profile
      const { error } = await supabase.from("profiles").delete().eq("id", estabelecimento.id);
      
      if (error) throw error;
      
      toast.success(`Estabelecimento "${estabelecimento.nome}" excluído com sucesso`);
      setEstabelecimentos(prev => prev.filter(e => e.id !== estabelecimento.id));
    } catch (error) {
      console.error("Error deleting estabelecimento:", error);
      toast.error("Erro ao excluir estabelecimento");
    } finally {
      setDeleting(false);
    }
  };

  const filteredEstabelecimentos = estabelecimentos.filter(est => {
    const email = emailMap[est.id] || "";
    return est.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (est.cidade?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (est.endereco?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTipoEstabelecimento = (tipo: string | null) => {
    if (!tipo) return "-";
    const tipos: Record<string, string> = {
      bar: "Bar",
      restaurante: "Restaurante",
      casa_de_shows: "Casa de Shows",
      pub: "Pub",
      hotel: "Hotel",
      evento: "Evento",
      outros: "Outros"
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total de Estabelecimentos</CardDescription>
          <CardTitle className="text-3xl flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            {estabelecimentos.length}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Search and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, cidade ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchEstabelecimentos} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Estabelecimentos ({filteredEstabelecimentos.length})</CardTitle>
          <CardDescription>Lista de todos os estabelecimentos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredEstabelecimentos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum estabelecimento encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estabelecimento</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstabelecimentos.map((est) => (
                    <TableRow key={est.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={est.foto_url || undefined} />
                            <AvatarFallback>{est.nome[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{est.nome}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {est.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {emailMap[est.id] || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {est.cidade || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {formatTipoEstabelecimento(est.tipo_estabelecimento)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {est.endereco || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/local/${est.id}`)}
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
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Estabelecimento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir "{est.nome}"? 
                                  Esta ação é irreversível e irá excluir todos os dados relacionados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(est)}
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
    </div>
  );
}
