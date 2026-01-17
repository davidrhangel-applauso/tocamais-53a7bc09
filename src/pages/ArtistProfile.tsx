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
import { ArrowLeft, Music, Heart, Instagram, Youtube, Music2, ExternalLink, Lock, DollarSign } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useProfilePermissions } from "@/hooks/useProfilePermissions";
import { useSubscription } from "@/hooks/useSubscription";
import { useSessionId } from "@/hooks/useSessionId";
import { z } from "zod";
import { TipPaymentDialog } from "@/components/TipPaymentDialog";
import { TwoStepPixPaymentDialog } from "@/components/TwoStepPixPaymentDialog";
import { validarCPF, formatarCPF, limparCPF } from "@/lib/cpf-utils";

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
const tipSchema = z.object({
  valor: z.string()
    .trim()
    .min(1, "Por favor, digite um valor")
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Valor inválido"
    })
    .refine((val) => {
      const num = parseFloat(val);
      return isFinite(num) && num > 0;
    }, {
      message: "O valor deve ser maior que zero"
    })
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 10000;
    }, {
      message: "Valor máximo: R$ 10.000,00"
    })
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 1;
    }, {
      message: "Valor mínimo: R$ 1,00"
    })
    .refine((val) => {
      const num = parseFloat(val);
      const decimals = (val.split('.')[1] || '').length;
      return decimals <= 2;
    }, {
      message: "Use no máximo 2 casas decimais"
    }),
  clienteNome: z.string()
    .trim()
    .min(1, "Por favor, digite seu nome")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  clienteCpf: z.string()
    .trim()
    .min(1, "CPF é obrigatório")
    .refine((cpf) => validarCPF(cpf), {
      message: "CPF inválido"
    }),
  pedidoMusica: z.string()
    .trim()
    .max(200, "Nome da música deve ter no máximo 200 caracteres")
    .optional(),
  pedidoMensagem: z.string()
    .trim()
    .max(500, "Dedicatória deve ter no máximo 500 caracteres")
    .optional()
});

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
  const [musicaGorjetaCustomizada, setMusicaGorjetaCustomizada] = useState(false);
  const [scrollY, setScrollY] = useState(0);
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
  
  // Tip form state
  const [valorGorjeta, setValorGorjeta] = useState("");
  const [clienteNomeGorjeta, setClienteNomeGorjeta] = useState("");
  const [clienteCpfGorjeta, setClienteCpfGorjeta] = useState("");
  const [pedidoMusica, setPedidoMusica] = useState("");
  const [pedidoMensagem, setPedidoMensagem] = useState("");
  
  // Tip payment dialog state
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [directPixDialogOpen, setDirectPixDialogOpen] = useState(false);
  
  // Interaction type state
  const [interactionType, setInteractionType] = useState<'tip' | 'request'>('tip');
  
  // Check permissions for sensitive data
  const { canViewSensitiveData, loading: permissionsLoading } = useProfilePermissions(id);
  
  // Check if artist is Pro
  const { isPro, isLoading: subscriptionLoading } = useSubscription(id || null);
  const isMobile = useIsMobile();
  const tipCardRef = useRef<HTMLDivElement>(null);
  
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

  const handleOpenTipDialog = () => {
    // Validate form before opening dialog
    const validationResult = tipSchema.safeParse({ 
      valor: valorGorjeta,
      clienteNome: clienteNomeGorjeta,
      clienteCpf: clienteCpfGorjeta,
      pedidoMusica: pedidoMusica || "",
      pedidoMensagem: pedidoMensagem || ""
    });
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (currentUserId === id) {
      toast.error("Você não pode enviar gorjeta para si mesmo");
      return;
    }

    setTipDialogOpen(true);
  };

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

                {/* Social Links - compact on mobile */}
                {canViewSensitiveData ? (
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
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg mb-4">
                    <Lock className="w-3 h-3" />
                    <p>Links visíveis após interação</p>
                  </div>
                )}

                {/* Prominent tip button on mobile */}
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
                  size="lg"
                  onClick={() => {
                    if (isPro && pixInfo.pix_chave) {
                      setDirectPixDialogOpen(true);
                    } else {
                      scrollToTipCard();
                    }
                  }}
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Enviar Gorjeta
                  {isPro && <Badge className="ml-2 text-[10px] bg-white/20 border-0">0% taxa</Badge>}
                </Button>
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
                            ⭐ Pro • 0% taxa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-base px-3 py-1">
                            Free • 20% taxa
                          </Badge>
                        )}
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

                  {/* Social Links */}
                  {canViewSensitiveData ? (
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
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <Lock className="w-4 h-4" />
                      <p>Links de redes sociais visíveis após interação com o artista</p>
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
                {/* TIP FLOW */}
                {isPro && pixInfo.pix_chave ? (
                  <>
                    {/* PRO with own PIX - simplified flow */}
                    <div className="p-4 bg-gradient-to-br from-amber-500/10 to-yellow-400/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0">
                          ⭐ PRO
                        </Badge>
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          100% vai para o artista
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Este artista recebe pagamentos diretamente via PIX, sem taxas e instantaneamente.
                      </p>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={() => setDirectPixDialogOpen(true)}
                    >
                      Enviar Gorjeta via PIX
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Regular flow with Mercado Pago */}
                    <div>
                      <Label htmlFor="clienteNomeGorjeta">Seu nome *</Label>
                      <Input
                        id="clienteNomeGorjeta"
                        placeholder="Ex: Maria"
                        value={clienteNomeGorjeta}
                        onChange={(e) => setClienteNomeGorjeta(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="clienteCpfGorjeta">CPF *</Label>
                      <Input
                        id="clienteCpfGorjeta"
                        placeholder="000.000.000-00"
                        value={clienteCpfGorjeta}
                        onChange={(e) => setClienteCpfGorjeta(formatarCPF(e.target.value))}
                        maxLength={14}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Necessário para melhor pontuação no Mercado Pago
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="valor">Valor (R$) *</Label>
                      <Input
                        id="valor"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="10.00"
                        value={valorGorjeta}
                        onChange={(e) => setValorGorjeta(e.target.value)}
                      />
                    </div>
                    
                    {/* Quick amounts */}
                    <div className="space-y-2">
                      <Label>Valores sugeridos</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValorGorjeta("5")}
                        >
                          R$ 5
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValorGorjeta("10")}
                        >
                          R$ 10
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValorGorjeta("20")}
                        >
                          R$ 20
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Campos opcionais de pedido */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Adicionar pedido musical (opcional)
                      </p>
                      
                      {musicas.length > 0 ? (
                        !musicaGorjetaCustomizada ? (
                          <div>
                            <Label htmlFor="pedidoMusica-select">Escolha uma música do repertório</Label>
                            <Select value={pedidoMusica} onValueChange={setPedidoMusica}>
                              <SelectTrigger id="pedidoMusica-select">
                                <SelectValue placeholder="Selecione uma música" />
                              </SelectTrigger>
                              <SelectContent>
                                {musicas.map((m) => (
                                  <SelectItem key={m.id} value={m.titulo}>
                                    <div className="flex flex-col">
                                      <span>{m.titulo}</span>
                                      {m.artista_original && (
                                        <span className="text-xs text-muted-foreground">
                                          {m.artista_original}
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="mt-1 px-0"
                              onClick={() => {
                                setMusicaGorjetaCustomizada(true);
                                setPedidoMusica("");
                              }}
                            >
                              Ou digite outra música
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Label htmlFor="pedidoMusica">
                              Música
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="ml-2 h-auto p-0"
                                onClick={() => {
                                  setMusicaGorjetaCustomizada(false);
                                  setPedidoMusica("");
                                }}
                              >
                                Ver repertório
                              </Button>
                            </Label>
                            <Input
                              id="pedidoMusica"
                              placeholder="Nome da música ou artista"
                              value={pedidoMusica}
                              onChange={(e) => setPedidoMusica(e.target.value)}
                            />
                          </div>
                        )
                      ) : (
                        <div>
                          <Label htmlFor="pedidoMusica">Música</Label>
                          <Input
                            id="pedidoMusica"
                            placeholder="Nome da música ou artista"
                            value={pedidoMusica}
                            onChange={(e) => setPedidoMusica(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 O artista ainda não cadastrou seu repertório
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <Label htmlFor="pedidoMensagem">Dedicatória</Label>
                        <Textarea
                          id="pedidoMensagem"
                          placeholder="Adicione uma dedicatória especial..."
                          value={pedidoMensagem}
                          onChange={(e) => setPedidoMensagem(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Payment breakdown */}
                    {valorGorjeta && parseFloat(valorGorjeta) > 0 && (
                      <div className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-2">
                        <p className="text-sm font-medium text-foreground">Detalhamento do pagamento:</p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gorjeta</span>
                            <span className="font-medium">R$ {parseFloat(valorGorjeta).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Artista recebe (80%)</span>
                            <span className="font-semibold">R$ {(parseFloat(valorGorjeta) * 0.80).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Taxa da plataforma (20%)</span>
                            <span>R$ {(parseFloat(valorGorjeta) * 0.20).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-border/50">
                            <span className="font-semibold text-foreground">Total a pagar</span>
                            <span className="font-bold text-foreground">R$ {parseFloat(valorGorjeta).toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          O artista receberá 80% do valor da gorjeta após a dedução de 20% da taxa da plataforma.
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleOpenTipDialog}
                      disabled={!valorGorjeta || parseFloat(valorGorjeta) <= 0 || !clienteNomeGorjeta.trim() || !clienteCpfGorjeta.trim()}
                    >
                      Continuar para Pagamento
                    </Button>
                    
                    {!canViewSensitiveData && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded justify-center">
                        <Lock className="w-3 h-3" />
                        <p>Link PIX visível após enviar gorjeta</p>
                      </div>
                    )}
                  </>
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
                
                {musicas.length > 0 ? (
                  !musicaCustomizada ? (
                    <div>
                      <Label htmlFor="musica-select">Escolha uma música do repertório *</Label>
                      <Select value={musica} onValueChange={setMusica}>
                        <SelectTrigger id="musica-select">
                          <SelectValue placeholder="Selecione uma música" />
                        </SelectTrigger>
                        <SelectContent>
                          {musicas.map((m) => (
                            <SelectItem key={m.id} value={m.titulo}>
                              <div className="flex flex-col">
                                <span>{m.titulo}</span>
                                {m.artista_original && (
                                  <span className="text-xs text-muted-foreground">
                                    {m.artista_original}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

      {/* Tip Payment Dialog (Mercado Pago) */}
      <TipPaymentDialog
        open={tipDialogOpen}
        onOpenChange={setTipDialogOpen}
        valor={parseFloat(valorGorjeta) || 0}
        artistaId={id || ""}
        clienteId={currentUserId}
        clienteNome={clienteNomeGorjeta}
        clienteCpf={limparCPF(clienteCpfGorjeta)}
        sessionId={sessionId}
        pedidoMusica={pedidoMusica || null}
        pedidoMensagem={pedidoMensagem || null}
      />

      {/* Two-Step PIX Payment Dialog (PRO only) */}
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

      {/* Floating tip button for mobile */}
      {isMobile && (
        <Button
          className="fixed bottom-20 right-4 z-40 rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 p-0 animate-pulse hover:animate-none"
          onClick={() => {
            if (isPro && pixInfo.pix_chave) {
              setDirectPixDialogOpen(true);
            } else {
              scrollToTipCard();
            }
          }}
        >
          <DollarSign className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
};

export default ArtistProfile;
