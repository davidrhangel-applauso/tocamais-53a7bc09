import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Building2, 
  Music, 
  User, 
  Clock, 
  Star, 
  QrCode, 
  Settings, 
  LogOut,
  Check,
  X,
  Play,
  History
} from "lucide-react";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import ProfileQRCode from "@/components/ProfileQRCode";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const EstabelecimentoPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);

  const { activeCheckin, pedidos, refetch } = useEstabelecimento(user?.id || null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth-estabelecimento');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData || profileData.tipo !== 'estabelecimento') {
        toast.error("Acesso não autorizado");
        navigate('/');
        return;
      }

      setUser(user);
      setProfile(profileData);
      setLoading(false);

      // Fetch avaliacoes
      const { data: avaliacoesData } = await supabase
        .from('avaliacoes_artistas')
        .select('*')
        .eq('estabelecimento_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setAvaliacoes(avaliacoesData || []);

      // Fetch historico de checkins
      const { data: historicoData } = await supabase
        .from('estabelecimento_checkins')
        .select('*')
        .eq('estabelecimento_id', user.id)
        .eq('ativo', false)
        .order('fim', { ascending: false })
        .limit(20);

      setHistorico(historicoData || []);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth-estabelecimento');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth-estabelecimento');
  };

  const handleUpdatePedido = async (pedidoId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('pedidos_estabelecimento')
        .update({ status })
        .eq('id', pedidoId);

      if (error) throw error;
      toast.success(`Pedido ${status === 'concluido' ? 'concluído' : status}!`);
      refetch();
    } catch (error) {
      console.error('Error updating pedido:', error);
      toast.error("Erro ao atualizar pedido");
    }
  };

  const handleEncerrarCheckin = async () => {
    if (!activeCheckin) return;

    try {
      const { error } = await supabase
        .from('estabelecimento_checkins')
        .update({ ativo: false, fim: new Date().toISOString() })
        .eq('id', activeCheckin.checkin_id);

      if (error) throw error;
      toast.success("Apresentação encerrada!");
      refetch();
    } catch (error) {
      console.error('Error ending checkin:', error);
      toast.error("Erro ao encerrar apresentação");
    }
  };

  const averageRating = avaliacoes.length > 0
    ? (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const pendingPedidos = pedidos.filter(p => p.status === 'pendente');
  const profileUrl = `${window.location.origin}/local/${user?.id}`;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={profile?.foto_url || undefined} />
              <AvatarFallback>
                <Building2 className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold text-lg">{profile?.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.tipo_estabelecimento?.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/configuracoes')}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-primary">{pendingPedidos.length}</p>
              <p className="text-xs text-muted-foreground">Pedidos Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-primary">{historico.length}</p>
              <p className="text-xs text-muted-foreground">Apresentações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">
                {averageRating || '-'}
              </p>
              <p className="text-xs text-muted-foreground">Média Avaliações</p>
            </CardContent>
          </Card>
        </div>

        {/* Active checkin */}
        <Card className={activeCheckin ? "border-green-500/50 bg-green-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Music className="w-5 h-5" />
              Artista no Palco
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCheckin ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={activeCheckin.artista_foto || undefined} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{activeCheckin.artista_nome}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Desde {format(new Date(activeCheckin.inicio), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleEncerrarCheckin}>
                  Encerrar
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum artista no momento</p>
                <p className="text-sm">Aguardando check-in</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="pedidos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pedidos" className="relative">
              Pedidos
              {pendingPedidos.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs" variant="destructive">
                  {pendingPedidos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="space-y-3 mt-4">
            {pedidos.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pedido ainda</p>
                  <p className="text-sm">Os pedidos dos clientes aparecerão aqui</p>
                </CardContent>
              </Card>
            ) : (
              pedidos.map((pedido) => (
                <Card key={pedido.id} className={pedido.status === 'pendente' ? 'border-primary/30' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{pedido.musica}</p>
                          <Badge variant={
                            pedido.status === 'pendente' ? 'default' :
                            pedido.status === 'aceito' ? 'secondary' :
                            pedido.status === 'concluido' ? 'outline' : 'destructive'
                          }>
                            {pedido.status}
                          </Badge>
                        </div>
                        {pedido.cliente_nome && (
                          <p className="text-sm text-muted-foreground">
                            De: {pedido.cliente_nome}
                          </p>
                        )}
                        {pedido.mensagem && (
                          <p className="text-sm mt-1 italic">"{pedido.mensagem}"</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(pedido.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      {pedido.status === 'pendente' && (
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600"
                            onClick={() => handleUpdatePedido(pedido.id, 'aceito')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleUpdatePedido(pedido.id, 'recusado')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {pedido.status === 'aceito' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdatePedido(pedido.id, 'concluido')}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Tocou
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="avaliacoes" className="space-y-3 mt-4">
            {avaliacoes.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma avaliação ainda</p>
                  <p className="text-sm">As avaliações dos clientes aparecerão aqui</p>
                </CardContent>
              </Card>
            ) : (
              avaliacoes.map((avaliacao) => (
                <Card key={avaliacao.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{avaliacao.artista_nome || 'Artista'}</p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= avaliacao.nota
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {avaliacao.comentario && (
                          <p className="text-sm text-muted-foreground italic">
                            "{avaliacao.comentario}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(avaliacao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="historico" className="space-y-3 mt-4">
            {historico.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma apresentação ainda</p>
                  <p className="text-sm">O histórico de artistas aparecerá aqui</p>
                </CardContent>
              </Card>
            ) : (
              historico.map((checkin) => (
                <Card key={checkin.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{checkin.artista_nome || 'Artista'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(checkin.inicio), "dd/MM/yyyy", { locale: ptBR })}
                          {' • '}
                          {format(new Date(checkin.inicio), "HH:mm", { locale: ptBR })}
                          {checkin.fim && ` - ${format(new Date(checkin.fim), "HH:mm", { locale: ptBR })}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="qrcode" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code do Estabelecimento
                </CardTitle>
                <CardDescription>
                  Compartilhe este QR Code para os clientes fazerem pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileQRCode artistId={user?.id || ''} artistName={profile?.nome || ''} />
                <p className="text-center text-sm text-muted-foreground mt-4">
                  {profileUrl}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EstabelecimentoPanel;
