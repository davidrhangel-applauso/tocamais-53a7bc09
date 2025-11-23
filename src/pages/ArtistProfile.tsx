import { useEffect, useState } from "react";
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
import { ArrowLeft, Music, Heart, Instagram, Youtube, Music2, ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";
import { useProfilePermissions } from "@/hooks/useProfilePermissions";
import { z } from "zod";
import { PixPaymentDialog } from "@/components/PixPaymentDialog";

// Validation schema for song requests
const songRequestSchema = z.object({
  musica: z.string()
    .trim()
    .min(1, "Por favor, digite o nome da música")
    .max(200, "Nome da música deve ter no máximo 200 caracteres"),
  mensagem: z.string()
    .trim()
    .max(500, "Mensagem deve ter no máximo 500 caracteres")
    .optional()
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
    })
});

interface Artist {
  id: string;
  nome: string;
  cidade: string;
  estilo_musical: string;
  bio: string;
  foto_url: string;
  instagram: string;
  youtube: string;
  spotify: string;
  link_pix: string;
  status_destaque: boolean;
  ativo_ao_vivo: boolean;
}

const ArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Request form state
  const [musica, setMusica] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  
  // Tip form state
  const [valorGorjeta, setValorGorjeta] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  
  // Pix payment state
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixPaymentData, setPixPaymentData] = useState<{
    gorjetaId: string;
    qrCode: string;
    qrCodeBase64: string;
    expiresAt: string;
  } | null>(null);
  
  // Check permissions for sensitive data
  const { canViewSensitiveData, loading: permissionsLoading } = useProfilePermissions(id);

  useEffect(() => {
    checkAuth();
    fetchArtist();
  }, [id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(user.id);
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
    } catch (error: any) {
      toast.error("Erro ao carregar perfil do artista");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    // Validate song request with zod
    const validation = songRequestSchema.safeParse({ 
      musica, 
      mensagem: mensagem || "" 
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (!currentUserId || !artist) return;

    setRequestLoading(true);
    try {
      const { error } = await supabase.from("pedidos").insert({
        artista_id: artist.id,
        cliente_id: currentUserId,
        musica: validation.data.musica,
        mensagem: validation.data.mensagem || null,
        status: "pendente",
      });

      if (error) throw error;

      toast.success("Pedido enviado com sucesso!");
      setMusica("");
      setMensagem("");
    } catch (error: any) {
      toast.error("Erro ao enviar pedido: " + error.message);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSendTip = async () => {
    if (!currentUserId || !id) {
      toast.error("Você precisa estar logado para enviar gorjetas");
      return;
    }

    // Validate form
    const validationResult = tipSchema.safeParse({ valor: valorGorjeta });
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (currentUserId === id) {
      toast.error("Você não pode enviar gorjeta para si mesmo");
      return;
    }

    setTipLoading(true);

    try {
      const valor = parseFloat(valorGorjeta);

      // Criar pagamento Pix via edge function
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          valor,
          artista_id: id,
          cliente_id: currentUserId,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar pagamento');
      }

      // Abrir dialog com QR Code
      setPixPaymentData({
        gorjetaId: data.gorjeta_id,
        qrCode: data.qr_code,
        qrCodeBase64: data.qr_code_base64,
        expiresAt: data.expires_at,
      });
      setPixDialogOpen(true);
      
      toast.success("QR Code gerado! Escaneie para pagar");
      setValorGorjeta("");
    } catch (error: any) {
      console.error('Error creating Pix payment:', error);
      toast.error("Erro ao gerar pagamento Pix: " + (error.message || 'Tente novamente'));
    } finally {
      setTipLoading(false);
    }
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Artist Header */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-32 h-32">
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
                      {artist.status_destaque && (
                        <Badge variant="default" className="text-base px-3 py-1">
                          ⭐ Destaque
                        </Badge>
                      )}
                      {artist.ativo_ao_vivo && (
                        <Badge variant="destructive" className="text-base px-3 py-1 animate-pulse">
                          🔴 AO VIVO
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
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Song Request Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Pedir Música
              </CardTitle>
              <CardDescription>
                Envie um pedido de música para {artist.nome}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="musica">Música *</Label>
                <Input
                  id="musica"
                  placeholder="Nome da música ou artista"
                  value={musica}
                  onChange={(e) => setMusica(e.target.value)}
                />
              </div>
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
            </CardContent>
          </Card>

          {/* Tip Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-accent" />
                Enviar Gorjeta
              </CardTitle>
              <CardDescription>
                Apoie {artist.nome} com uma gorjeta via Pix
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <Button
                className="w-full"
                onClick={handleSendTip}
                disabled={tipLoading || !valorGorjeta || parseFloat(valorGorjeta) <= 0}
              >
                {tipLoading ? "Processando..." : "Enviar Gorjeta via Pix"}
              </Button>
              
              {!canViewSensitiveData && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded justify-center">
                  <Lock className="w-3 h-3" />
                  <p>Link PIX visível após enviar gorjeta</p>
                </div>
              )}
              {canViewSensitiveData && !artist.link_pix && (
                <p className="text-xs text-muted-foreground text-center">
                  Este artista ainda não configurou o Pix
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Pix Payment Dialog */}
      {pixPaymentData && (
        <PixPaymentDialog
          open={pixDialogOpen}
          onOpenChange={setPixDialogOpen}
          gorjetaId={pixPaymentData.gorjetaId}
          qrCode={pixPaymentData.qrCode}
          qrCodeBase64={pixPaymentData.qrCodeBase64}
          expiresAt={pixPaymentData.expiresAt}
        />
      )}
    </div>
  );
};

export default ArtistProfile;
