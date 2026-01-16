import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Search, ArrowLeft, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";

interface Artist {
  id: string;
  nome: string;
  estilo_musical: string | null;
  foto_url: string | null;
  bio: string | null;
  ativo_ao_vivo: boolean | null;
}

// IDs dos administradores que devem ser ocultados da lista de artistas
const ADMIN_USER_IDS = [
  "0120d3e5-2c0c-4115-a27f-94dcf5e7ae7d",
  "ae4abf4e-d360-49a5-ad3e-9cb3a710ca26"
];

const SearchArtists = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [filterLive, setFilterLive] = useState<string>("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Carregar artistas iniciais
  useEffect(() => {
    // Carregar todos os artistas inicialmente
    searchArtists("", "all", "all");
    setIsInitialLoad(false);
  }, []);

  // Função de busca em tempo real (debounced)
  const searchArtists = useCallback(async (term: string, style: string, live: string) => {
    setLoading(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from("profiles")
        .select("id, nome, estilo_musical, foto_url, bio, ativo_ao_vivo")
        .eq("tipo", "artista")
        .not("id", "in", `(${ADMIN_USER_IDS.join(",")})`);

      // Aplicar filtro de nome
      if (term.trim()) {
        query = query.or(`nome.ilike.${term}%,nome.ilike.% ${term}%,nome.ilike.%${term}%`);
      }

      // Aplicar filtro de estilo musical
      if (style && style !== "all") {
        query = query.eq("estilo_musical", style as any);
      }

      // Aplicar filtro de disponibilidade ao vivo
      if (live === "true") {
        query = query.eq("ativo_ao_vivo", true);
      } else if (live === "false") {
        query = query.eq("ativo_ao_vivo", false);
      }

      const { data, error } = await query
        .order("ativo_ao_vivo", { ascending: false })
        .order("nome")
        .limit(20);

      if (error) throw error;

      setArtists(data || []);
    } catch (error: any) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce da busca - aguarda 300ms após o usuário parar de digitar
  useEffect(() => {
    if (isInitialLoad) return; // Não executar na carga inicial
    
    const timeoutId = setTimeout(() => {
      searchArtists(searchTerm, filterStyle, filterLive);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStyle, filterLive, searchArtists, isInitialLoad]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // A busca já está sendo feita em tempo real pelo useEffect
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStyle("all");
    setFilterLive("all");
    setArtists([]);
    setHasSearched(false);
  };

  const musicStyles = [
    { value: "rock", label: "Rock" },
    { value: "pop", label: "Pop" },
    { value: "jazz", label: "Jazz" },
    { value: "blues", label: "Blues" },
    { value: "samba", label: "Samba" },
    { value: "mpb", label: "MPB" },
    { value: "sertanejo", label: "Sertanejo" },
    { value: "eletronica", label: "Eletrônica" },
    { value: "rap", label: "Rap" },
    { value: "funk", label: "Funk" },
    { value: "outros", label: "Outros" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/auth")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="mb-8 border-primary/20 shadow-glow">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Music className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gradient">Encontre seu Artista</CardTitle>
            <CardDescription>
              Busque artistas pelo nome e acesse seus perfis para fazer pedidos e gorjetas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Digite o nome do artista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  autoFocus
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button type="submit" disabled={loading || !searchTerm.trim()}>
                <Search className="w-4 h-4" />
              </Button>
            </form>
            {searchTerm && (
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Buscando enquanto você digita...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Filtros Avançados */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Filtros Avançados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estilo Musical</label>
                <Select value={filterStyle} onValueChange={setFilterStyle}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todos os estilos" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">Todos os estilos</SelectItem>
                    {musicStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Disponibilidade</label>
                <Select value={filterLive} onValueChange={setFilterLive}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="true">Ao Vivo</SelectItem>
                    <SelectItem value="false">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(filterStyle !== "all" || filterLive !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
              >
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading && artists.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
                  <p className="text-muted-foreground">
                    Buscando artistas...
                  </p>
                </CardContent>
              </Card>
            ) : artists.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold">
                    {artists.length} {artists.length === 1 ? "artista" : "artistas"}
                    {searchTerm || filterStyle !== "all" || filterLive !== "all" 
                      ? (artists.length === 1 ? " encontrado" : " encontrados")
                      : " disponíveis"
                    }
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Badge variant="secondary">
                        Nome: "{searchTerm}"
                      </Badge>
                    )}
                    {filterStyle !== "all" && (
                      <Badge variant="secondary">
                        <Music className="w-3 h-3 mr-1" />
                        {musicStyles.find(s => s.value === filterStyle)?.label}
                      </Badge>
                    )}
                    {filterLive === "true" && (
                      <Badge variant="default" className="bg-green-500">
                        Ao Vivo
                      </Badge>
                    )}
                  </div>
                </div>
                {artists.map((artist) => (
                  <Card 
                    key={artist.id}
                    className="cursor-pointer hover:border-primary/40 transition-all hover:shadow-lg"
                    onClick={() => navigate(`/artista/${artist.id}`)}
                  >
                    <CardContent className="flex items-center gap-4 p-6">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={artist.foto_url || ""} alt={artist.nome} />
                        <AvatarFallback>
                          {artist.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{artist.nome}</h3>
                          {artist.ativo_ao_vivo && (
                            <Badge variant="default" className="bg-green-500">
                              Ao Vivo
                            </Badge>
                          )}
                        </div>
                        
                        {artist.bio && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {artist.bio}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {artist.estilo_musical && (
                            <div className="flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              {artist.estilo_musical}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button variant="outline">
                        Ver Perfil
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum artista encontrado com os filtros aplicados
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tente ajustar os filtros ou limpar a busca
                  </p>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
};

export default SearchArtists;
