import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Building2, MapPin, Music, User, Send, Star, ArrowLeft } from "lucide-react";
import { useSessionId } from "@/hooks/useSessionId";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { RatingDialog } from "@/components/RatingDialog";

const EstabelecimentoProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = useSessionId();
  const { estabelecimento, activeCheckin, loading } = useEstabelecimento(id || null);

  const [clienteNome, setClienteNome] = useState("");
  const [musica, setMusica] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [lastCompletedCheckin, setLastCompletedCheckin] = useState<any>(null);

  // Check if there's a recently completed checkin for rating
  useEffect(() => {
    const checkForRating = async () => {
      if (!id || !sessionId) return;

      try {
        // Get completed checkins from last hour that haven't been rated
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data: checkins } = await supabase
          .from('estabelecimento_checkins')
          .select('*')
          .eq('estabelecimento_id', id)
          .eq('ativo', false)
          .gte('fim', oneHourAgo)
          .order('fim', { ascending: false })
          .limit(1);

        if (checkins && checkins.length > 0) {
          // Check if already rated
          const { data: existingRating } = await supabase
            .from('avaliacoes_artistas')
            .select('id')
            .eq('checkin_id', checkins[0].id)
            .eq('session_id', sessionId)
            .single();

          if (!existingRating) {
            setLastCompletedCheckin(checkins[0]);
            setShowRatingDialog(true);
          }
        }
      } catch (error) {
        console.error('Error checking for rating:', error);
      }
    };

    checkForRating();
  }, [id, sessionId]);

  const handleSubmitPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!musica.trim()) {
      toast.error("Digite o nome da música");
      return;
    }

    if (!activeCheckin) {
      toast.error("Não há artista tocando no momento");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('pedidos_estabelecimento')
        .insert({
          estabelecimento_id: id,
          checkin_id: activeCheckin.checkin_id,
          cliente_nome: clienteNome.trim() || null,
          session_id: sessionId,
          musica: musica.trim(),
          mensagem: mensagem.trim() || null,
        });

      if (error) throw error;

      toast.success("Pedido enviado com sucesso!");
      setMusica("");
      setMensagem("");
    } catch (error: any) {
      console.error('Error submitting pedido:', error);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!estabelecimento) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Estabelecimento não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O estabelecimento que você procura não existe ou foi removido.
            </p>
            <Button onClick={() => navigate("/buscar")}>
              Buscar Artistas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tipoLabel = estabelecimento.tipo_estabelecimento
    ? estabelecimento.tipo_estabelecimento.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Estabelecimento';

  return (
    <div className="min-h-screen bg-background">
      {/* Header with cover photo */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20">
        {estabelecimento.foto_capa_url && (
          <img
            src={estabelecimento.foto_capa_url}
            alt="Capa"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/50 backdrop-blur-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-16 relative z-10 pb-8">
        {/* Profile info */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                <AvatarImage src={estabelecimento.foto_url || undefined} />
                <AvatarFallback className="bg-primary/10">
                  <Building2 className="w-8 h-8 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{estabelecimento.nome}</h1>
                <Badge variant="secondary" className="mt-1">
                  {tipoLabel}
                </Badge>
                {estabelecimento.cidade && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {estabelecimento.cidade}
                  </p>
                )}
              </div>
            </div>
            
            {estabelecimento.bio && (
              <p className="text-sm text-muted-foreground mt-4">
                {estabelecimento.bio}
              </p>
            )}

            {estabelecimento.endereco && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {estabelecimento.endereco}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Current artist */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Artista no Palco
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCheckin ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={activeCheckin.artista_foto || undefined} />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{activeCheckin.artista_nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Tocando agora 🎵
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum artista no momento</p>
                <p className="text-sm">Aguarde o próximo show!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pedir Música</CardTitle>
            <CardDescription>
              {activeCheckin 
                ? "Faça seu pedido para o artista!" 
                : "Aguarde um artista começar a tocar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPedido} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cliente-nome">Seu Nome (opcional)</Label>
                <Input
                  id="cliente-nome"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Como você quer ser chamado?"
                  disabled={!activeCheckin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musica">Música *</Label>
                <Input
                  id="musica"
                  value={musica}
                  onChange={(e) => setMusica(e.target.value)}
                  placeholder="Nome da música e artista"
                  required
                  disabled={!activeCheckin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem (opcional)</Label>
                <Textarea
                  id="mensagem"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Uma dedicatória ou recado..."
                  rows={3}
                  disabled={!activeCheckin}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!activeCheckin || submitting}
              >
                {submitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Pedido
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Rating prompt */}
        {lastCompletedCheckin && (
          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <h3 className="font-semibold mb-1">Avalie o artista!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {lastCompletedCheckin.artista_nome || 'O artista'} acabou de tocar. Que tal dar uma nota?
                </p>
                <Button onClick={() => setShowRatingDialog(true)}>
                  Avaliar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        checkin={lastCompletedCheckin}
        sessionId={sessionId}
        estabelecimentoId={id || ''}
      />
    </div>
  );
};

export default EstabelecimentoProfile;
