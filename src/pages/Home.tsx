import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, LogOut, Star, MessageCircle, Settings, Eye, ArrowLeft, Music } from "lucide-react";
import logoTocaMais from "@/assets/logo-tocamais.png";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import { waitForProfile } from "@/lib/auth-utils";

interface Artist {
  id: string;
  nome: string;
  cidade: string;
  estilo_musical: string;
  bio: string;
  foto_url: string;
  status_destaque: boolean;
  ativo_ao_vivo: boolean;
}

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const [userType, setUserType] = useState<"artista" | "cliente" | "estabelecimento">("cliente");
  const [profileExists, setProfileExists] = useState(false);
  
  const isPreviewMode = searchParams.get('preview') === 'true';

  useEffect(() => {
    checkAuth();
    fetchArtists();
  }, []);

  const checkAuth = async () => {
    setAuthLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      setUserId(user.id);

      // Wait for profile with retry logic
      const profile = await waitForProfile(user.id, 5, 500);
      
      if (!profile) {
        console.error("Profile not found after retries");
        setProfileExists(false);
        toast.error("Erro ao carregar perfil. Por favor, faça login novamente.");
        await supabase.auth.signOut();
        navigate("/auth", { replace: true });
        return;
      }

      setProfileExists(true);
      setUserType(profile.tipo);

      // Redirect artists to their panel (unless in preview mode)
      if (profile.tipo === "artista" && !isPreviewMode) {
        navigate("/painel", { replace: true });
        return;
      }

      // Redirect estabelecimentos to their panel
      if (profile.tipo === "estabelecimento") {
        navigate("/painel-local", { replace: true });
        return;
      }
      
      // Client stays on home page (or artist in preview mode)
      console.log("User authenticated successfully", { userId: user.id, tipo: profile.tipo, isPreviewMode });
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth", { replace: true });
    } finally {
      setAuthLoading(false);
    }
  };

  // IDs dos administradores que devem ser ocultados da lista de artistas
  const ADMIN_USER_IDS = [
    "0120d3e5-2c0c-4115-a27f-94dcf5e7ae7d",
    "ae4abf4e-d360-49a5-ad3e-9cb3a710ca26"
  ];

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("tipo", "artista")
        .not("id", "in", `(${ADMIN_USER_IDS.join(",")})`)
        .order("status_destaque", { ascending: false })
        .order("nome");

      if (error) throw error;
      setArtists(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar artistas");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredArtists = artists.filter(
    (artist) =>
      artist.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.estilo_musical?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredArtists = filteredArtists.filter((a) => a.status_destaque);
  const regularArtists = filteredArtists.filter((a) => !a.status_destaque);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <Music className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-primary/10 border-primary/20">
          <Eye className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Modo Visualização:</strong> Você está vendo a página como um cliente vê.
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate("/painel")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Painel
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoTocaMais} alt="Toca Mais" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-gradient">Toca+</h1>
          </div>
          <div className="flex gap-2">
            {!isPreviewMode && (
              <>
                <NotificationBell userId={userId} />
                <Button variant="outline" onClick={() => navigate("/mensagens")}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensagens
                </Button>
                <Button variant="outline" onClick={() => navigate("/configuracoes")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Buscar artistas por nome, cidade ou estilo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando artistas...</p>
          </div>
        ) : (
          <>
            {featuredArtists.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6 text-accent fill-accent" />
                  Artistas em Destaque
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredArtists.map((artist) => (
                    <Card
                      key={artist.id}
                      className="hover:shadow-glow transition-all duration-300 cursor-pointer border-primary/20"
                      onClick={() => navigate(`/artista/${artist.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={artist.foto_url} />
                            <AvatarFallback>{artist.nome[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{artist.nome}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{artist.cidade}</p>
                            <Badge variant="secondary">{artist.estilo_musical}</Badge>
                            {artist.ativo_ao_vivo && (
                              <Badge variant="destructive" className="ml-2">
                                AO VIVO
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold mb-4">Todos os Artistas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularArtists.map((artist) => (
                  <Card
                    key={artist.id}
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/artista/${artist.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={artist.foto_url} />
                          <AvatarFallback>{artist.nome[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{artist.nome}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{artist.cidade}</p>
                          <Badge variant="secondary">{artist.estilo_musical}</Badge>
                          {artist.ativo_ao_vivo && (
                            <Badge className="ml-2 bg-green-500 text-white hover:bg-green-600 animate-pulse">
                              AO VIVO
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {filteredArtists.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum artista encontrado</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Home;