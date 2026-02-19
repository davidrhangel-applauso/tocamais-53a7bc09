import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MusicCombobox } from "@/components/MusicCombobox";
import { ArrowLeft, Music, Heart, Instagram, Youtube, Music2, ExternalLink, Lock, DollarSign, ListMusic, Check, ChevronsUpDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useProfilePermissions } from "@/hooks/useProfilePermissions";
import { useSubscription } from "@/hooks/useSubscription";
import { useSessionId } from "@/hooks/useSessionId";
import { z } from "zod";
import { TwoStepPixPaymentDialog } from "@/components/TwoStepPixPaymentDialog";

// Validation schema for song requests
const songRequestSchema = z.object({
  musica: z.string()
    .trim()
    .min(1, "Por favor, digite o nome da música")
    .max(200, "Nome da música deve ter no máximo 200 caracteres"),
  mensagem: z.string()
    .trim()
    .max(500, "Mensagem deve ter no máximo 500 caracteres")
    .optional(),
  clienteNome: z.string().trim().optional()
});

// Validation schema for tip amounts
// tipSchema removed - no longer needed since we use TwoStepPixPaymentDialog

interface Artist {
  id: string;
  nome: string;
  cidade: string;
  estilo_musical: string;
  bio: string;
  foto_url: string;
  foto_capa_url: string | null;
  instagram: string;
  youtube: string;
  spotify: string;
  link_pix: string;
  status_destaque: boolean;
  ativo_ao_vivo: boolean;
  pix_qr_code_url: string | null;
}

interface Musica {
  id: string;
  titulo: string;
  artista_original: string | null;
}

interface ActiveSetlist {
  id: string;
  nome: string;
}

const ArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const sessionId = useSessionId();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [pixInfo, setPixInfo] = useState<{ pix_chave: string | null; pix_tipo_chave: string | null }>({ pix_chave: null, pix_tipo_chave: null });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [activeSetlist, setActiveSetlist] = useState<ActiveSetlist | null>(null);
  const [musicaCustomizada, setMusicaCustomizada] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [openMusicCombobox, setOpenMusicCombobox] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (coverRef.current) {
        const rect = coverRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Request form state
  const [musica, setMusica] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [clienteNomePedido, setClienteNomePedido] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  
  // Tip payment dialog state
  const [directPixDialogOpen, setDirectPixDialogOpen] = useState(false);
  
  // Interaction type state
  const [interactionType, setInteractionType] = useState<'tip' | 'request'>('tip');
  
  // Check permissions for sensitive data
  const { canViewSensitiveData, loading: permissionsLoading } = useProfilePermissions(id);
  
  // Check if artist is Pro
  const { isPro, isLoading: subscriptionLoading } = useSubscription(id || null);
  const isMobile = useIsMobile();
  const tipCardRef = useRef<HTMLDivElement>(null);
  
  // Check free tip limit for this artist
  const [artistLimitReached, setArtistLimitReached] = useState(false);
  
  useEffect(() => {
    if (!id || isPro) {
      setArtistLimitReached(false);
      return;
    }
    const checkLimit = async () => {
      const { data } = await supabase.rpc('get_artist_approved_total', { artist_id: id });
      setArtistLimitReached(Number(data) >= 10);
    };
    checkLimit();
  }, [id, isPro]);
  
  const scrollToTipCard = () => {
    tipCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    checkAuth();
    fetchArtist();
  }, [id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchArtist = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("tipo", "artista")
        .single();

      if (error) throw error;
      setArtist(data);

      // Buscar informações de PIX do artista (tabela separada)
      const { data: pixData } = await supabase
        .rpc('get_artist_pix_info', { p_artist_id: id });
      
      if (pixData && pixData.length > 0) {
        setPixInfo(pixData[0]);
      }

      // Check for active setlist
      const { data: setlistData } = await supabase
        .from("setlists")
        .select("id, nome")
        .eq("artista_id", id)
        .eq("ativa", true)
        .maybeSingle();

      if (setlistData) {
        setActiveSetlist(setlistData);
        
        // Fetch musicas from the active setlist
        const { data: setlistMusicasData } = await supabase
          .from("setlist_musicas")
          .select("musica_id, musicas_repertorio(id, titulo, artista_original)")
          .eq("setlist_id", setlistData.id)
          .order("ordem", { ascending: true });

        const musicasFromSetlist = setlistMusicasData
          ?.map(sm => sm.musicas_repertorio as unknown as Musica)
          .filter(Boolean) || [];
        
        setMusicas(musicasFromSetlist);
      } else {
        setActiveSetlist(null);
        
        // Fetch all musicas from repertoire
        const { data: musicasData } = await supabase
          .from("musicas_repertorio")
          .select("*")
          .eq("artista_id", id)
          .order("titulo", { ascending: true });

        setMusicas(musicasData || []);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar perfil do artista");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!sessionId || !artist) {
      toast.error("Erro ao carregar sessão. Recarregue a página.");
      return;
    }

    // Validate song request with zod
    const validation = songRequestSchema.safeParse({ 
      musica, 
      mensagem: mensagem || "",
      clienteNome: clienteNomePedido || ""
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setRequestLoading(true);
    try {
      const { error } = await supabase.from("pedidos").insert({
        artista_id: artist.id,
        cliente_id: currentUserId || null,
        cliente_nome: validation.data.clienteNome || null,
        session_id: sessionId,
        musica: validation.data.musica,
        mensagem: validation.data.mensagem || null,
        status: "pendente",
      });

      if (error) throw error;

      toast.success("Pedido enviado com sucesso!");
      setMusica("");
      setMensagem("");
      setClienteNomePedido("");
    } catch (error: any) {
      toast.error("Erro ao enviar pedido: " + error.message);
    } finally {
      setRequestLoading(false);
    }
  };

  // handleOpenTipDialog removed - using TwoStepPixPaymentDialog for all artists now

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!artist) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        {/* Artist Header */}
        <Card className="mb-6 md:mb-8 border-primary/20 overflow-hidden">
          {/* Cover Photo */}
          <div ref={coverRef} className="w-full h-36 md:h-64 relative overflow-hidden">
            {artist.foto_capa_url ? (
              <img 
                src={artist.foto_capa_url} 
                alt={`Capa de ${artist.nome}`}
                className="w-full h-[120%] object-cover transition-transform duration-75 ease-out"
                style={{ transform: `translateY(${scrollY * 0.3}px)` }}
              />
            ) : (
              <div 
                className="w-full h-[120%] bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/20 transition-transform duration-75 ease-out"
                style={{ transform: `translateY(${scrollY * 0.3}px)` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          
          <CardContent className="px-4 md:px-8 pb-6 -mt-12 md:-mt-16 relative">
            {/* Mobile Layout - Avatar centered */}
            {isMobile ? (
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 ring-4 ring-background shadow-xl">
                  <AvatarImage src={artist.foto_url} />
                  <AvatarFallback className="text-2xl">{artist.nome[0]}</AvatarFallback>
                </Avatar>
                
                <h1 className="text-2xl font-bold mt-3 mb-1">{artist.nome}</h1>
                
                {canViewSensitiveData && artist.cidade && (
                  <p className="text-sm text-muted-foreground mb-2">{artist.cidade}</p>
                )}
                
                {/* Compact badges row */}
                <div className="flex gap-1.5 flex-wrap justify-center mb-3">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {artist.estilo_musical}
                  </Badge>
                  {isPro ? (
                    <Badge className="text-xs px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0">
                      ⭐ Pro
                    </Badge>
                  ) : null}
                  {artist.ativo_ao_vivo && (
                    <Badge className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1" />
                      AO VIVO
                    </Badge>
                  )}
                </div>
                
                {artist.bio && (
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                    {artist.bio}
                  </p>
                )}

                {/* Social Links - sempre visíveis */}
                {(artist.instagram || artist.youtube || artist.spotify) && (
                  <div className="flex gap-2 justify-center mb-4">
                    {artist.instagram && (
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                        <a href={artist.instagram} target="_blank" rel="noopener noreferrer">
                          <Instagram className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {artist.youtube && (
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                        <a href={artist.youtube} target="_blank" rel="noopener noreferrer">
                          <Youtube className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {artist.spotify && (
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                        <a href={artist.spotify} target="_blank" rel="noopener noreferrer">
                          <Music2 className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Prominent tip button on mobile */}
                {artistLimitReached ? (
                  <div className="w-full p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      Este artista atingiu o limite de gorjetas gratuitas.
                    </p>
                  </div>
                ) : (
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
                    size="lg"
                    onClick={() => {
                      if (pixInfo.pix_chave) {
                        setDirectPixDialogOpen(true);
                      } else {
                        scrollToTipCard();
                      }
                    }}
                    disabled={!pixInfo.pix_chave}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Enviar Gorjeta
                    <Badge className="ml-2 text-[10px] bg-white/20 border-0">0% taxa</Badge>
                  </Button>
                )}
              </div>
            ) : (
              /* Desktop Layout */
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="w-32 h-32 ring-4 ring-background">
                  <AvatarImage src={artist.foto_url} />
                  <AvatarFallback className="text-3xl">{artist.nome[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-4xl font-bold mb-2">{artist.nome}</h1>
                      {canViewSensitiveData && artist.cidade && (
                        <p className="text-lg text-muted-foreground mb-2">{artist.cidade}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {artist.estilo_musical}
                        </Badge>
                        {isPro ? (
                          <Badge className="text-base px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0">
                            ⭐ Pro
                          </Badge>
                        ) : null}
                        {artist.status_destaque && (
                          <Badge variant="default" className="text-base px-3 py-1">
                            ⭐ Destaque
                          </Badge>
                        )}
                        {artist.ativo_ao_vivo && (
                          <Badge variant="default" className="text-base px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                            AO VIVO
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {artist.bio && (
                    <p className="text-foreground mb-4 leading-relaxed">{artist.bio}</p>
                  )}

                  {/* Social Links - sempre visíveis */}
                  {(artist.instagram || artist.youtube || artist.spotify) && (
                    <div className="flex gap-3 flex-wrap">
                      {artist.instagram && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={artist.instagram} target="_blank" rel="noopener noreferrer">
                            <Instagram className="w-4 h-4 mr-2" />
                            Instagram
                          </a>
                        </Button>
                      )}
                      {artist.youtube && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={artist.youtube} target="_blank" rel="noopener noreferrer">
                            <Youtube className="w-4 h-4 mr-2" />
                            YouTube
                          </a>
                        </Button>
                      )}
                      {artist.spotify && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={artist.spotify} target="_blank" rel="noopener noreferrer">
                            <Music2 className="w-4 h-4 mr-2" />
                            Spotify
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unified Interaction Card */}
        <Card ref={tipCardRef} className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Interagir com {artist.nome}
            </CardTitle>
            <CardDescription>
              Escolha como deseja interagir com o artista
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Interaction Type Selector */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={interactionType === 'tip' ? 'default' : 'outline'}
                className={`h-auto py-4 flex flex-col gap-1 ${interactionType === 'tip' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setInteractionType('tip')}
              >
                <Heart className="w-5 h-5" />
                <span className="text-sm font-medium">Gorjeta + Pedido</span>
                <span className="text-xs text-white">Apoie e peça uma música</span>
              </Button>
              <Button
                variant={interactionType === 'request' ? 'default' : 'outline'}
                className={`h-auto py-4 flex flex-col gap-1 ${interactionType === 'request' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setInteractionType('request')}
              >
                <Music className="w-5 h-5" />
                <span className="text-sm font-medium">Apenas Pedido</span>
                <span className="text-xs text-muted-foreground">Peça uma música grátis</span>
              </Button>
            </div>

            <Separator />

            {/* Conditional Content Based on Interaction Type */}
            {interactionType === 'tip' ? (
              <>
                {/* UNIFIED TIP FLOW - PIX direto for all artists */}
                {artistLimitReached ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center space-y-2">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      🚫 Este artista atingiu o limite de gorjetas gratuitas (R$ 10).
                    </p>
                    <p className="text-xs text-muted-foreground">
                      O artista precisa assinar o plano PRO para continuar recebendo gorjetas.
                    </p>
                  </div>
                ) : pixInfo.pix_chave ? (
                  <>
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary">
                          ✨ 100% vai para o artista
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pagamento direto via PIX, sem taxas e instantaneamente.
                      </p>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={() => setDirectPixDialogOpen(true)}
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Enviar Gorjeta via PIX
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Este artista ainda não configurou sua chave PIX para receber gorjetas.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Envie um pedido de música gratuito enquanto isso!
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* REQUEST ONLY FLOW */}
                <div>
                  <Label htmlFor="clienteNomePedido">Seu nome (opcional)</Label>
                  <Input
                    id="clienteNomePedido"
                    placeholder="Ex: João da mesa 5"
                    value={clienteNomePedido}
                    onChange={(e) => setClienteNomePedido(e.target.value)}
                  />
                </div>
                
                {/* Setlist/Repertoire indicator */}
                {musicas.length > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                    <ListMusic className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-primary font-medium">
                      {activeSetlist ? activeSetlist.nome : "Repertório completo"}
                    </span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {musicas.length} músicas
                    </Badge>
                  </div>
                )}
                
                {musicas.length > 0 ? (
                  !musicaCustomizada ? (
                    <div className="space-y-2">
                      <Label>Escolha uma música do repertório *</Label>
                      <MusicCombobox
                        open={openMusicCombobox}
                        onOpenChange={setOpenMusicCombobox}
                        items={musicas}
                        selectedTitle={musica}
                        onSelectTitle={setMusica}
                        triggerPlaceholder="Selecione uma música..."
                        searchPlaceholder="Buscar música..."
                        forceDrawer
                      />
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="mt-1 px-0"
                        onClick={() => {
                          setMusicaCustomizada(true);
                          setMusica("");
                        }}
                      >
                        Ou digite outra música
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="musica">
                        Música *
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="ml-2 h-auto p-0"
                          onClick={() => {
                            setMusicaCustomizada(false);
                            setMusica("");
                          }}
                        >
                          Ver repertório
                        </Button>
                      </Label>
                      <Input
                        id="musica"
                        placeholder="Nome da música ou artista"
                        value={musica}
                        onChange={(e) => setMusica(e.target.value)}
                      />
                    </div>
                  )
                ) : (
                  <div>
                    <Label htmlFor="musica">Música *</Label>
                    <Input
                      id="musica"
                      placeholder="Nome da música ou artista"
                      value={musica}
                      onChange={(e) => setMusica(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 O artista ainda não cadastrou seu repertório
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="mensagem">Mensagem (opcional)</Label>
                  <Textarea
                    id="mensagem"
                    placeholder="Adicione uma mensagem especial..."
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSendRequest}
                  disabled={requestLoading || !musica.trim()}
                >
                  {requestLoading ? "Enviando..." : "Enviar Pedido"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Two-Step PIX Payment Dialog - for all artists */}
      {pixInfo.pix_chave && (
        <TwoStepPixPaymentDialog
          open={directPixDialogOpen}
          onOpenChange={setDirectPixDialogOpen}
          artistaId={artist.id}
          artistaNome={artist.nome}
          pixChave={pixInfo.pix_chave}
          pixTipoChave={pixInfo.pix_tipo_chave || "aleatoria"}
          clienteId={currentUserId}
          sessionId={sessionId}
          musicas={musicas}
        />
      )}

    </div>
  );
};

export default ArtistProfile;
