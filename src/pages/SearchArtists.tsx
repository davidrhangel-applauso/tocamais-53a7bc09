import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Music, Search, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Artist {
  id: string;
  nome: string;
  cidade: string | null;
  estilo_musical: string | null;
  foto_url: string | null;
  bio: string | null;
  ativo_ao_vivo: boolean | null;
}

const SearchArtists = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast.error("Digite o nome do artista para buscar");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, cidade, estilo_musical, foto_url, bio, ativo_ao_vivo")
        .eq("tipo", "artista")
        .ilike("nome", `%${searchTerm}%`)
        .order("nome");

      if (error) throw error;

      setArtists(data || []);
      
      if (data && data.length === 0) {
        toast.info("Nenhum artista encontrado com esse nome");
      }
    } catch (error: any) {
      toast.error("Erro ao buscar artistas");
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

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
              <Input
                type="text"
                placeholder="Digite o nome do artista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {hasSearched && (
          <div className="space-y-4">
            {artists.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  {artists.length} {artists.length === 1 ? "artista encontrado" : "artistas encontrados"}
                </h2>
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
                          {artist.cidade && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {artist.cidade}
                            </div>
                          )}
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
                    Nenhum artista encontrado com "{searchTerm}"
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tente buscar com outro nome
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchArtists;
