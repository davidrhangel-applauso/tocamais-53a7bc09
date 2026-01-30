import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Search, ListMusic, User, Instagram, Youtube } from "lucide-react";

interface Musica {
  id: string;
  titulo: string;
  artista_original: string | null;
}

interface ArtistaInfo {
  nome: string;
  foto_url: string | null;
  instagram: string | null;
  youtube: string | null;
  spotify: string | null;
  estilo_musical: string | null;
}

interface ArtistRepertoireDisplayProps {
  artistaId: string | null;
  onSelectMusica?: (musica: Musica) => void;
  selectedMusica?: string;
}

export const ArtistRepertoireDisplay = ({
  artistaId,
  onSelectMusica,
  selectedMusica,
}: ArtistRepertoireDisplayProps) => {
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [artista, setArtista] = useState<ArtistaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!artistaId) {
        setMusicas([]);
        setArtista(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch artist info
        const { data: artistaData } = await supabase
          .from("profiles")
          .select("nome, foto_url, instagram, youtube, spotify, estilo_musical")
          .eq("id", artistaId)
          .single();

        if (artistaData) {
          setArtista(artistaData);
        }

        // First check if there's an active setlist
        const { data: activeSetlist } = await supabase
          .from("setlists")
          .select("id")
          .eq("artista_id", artistaId)
          .eq("ativa", true)
          .maybeSingle();

        if (activeSetlist) {
          // Get musics from the active setlist
          const { data: setlistMusicas } = await supabase
            .from("setlist_musicas")
            .select(`
              musica_id,
              ordem,
              musicas_repertorio (
                id,
                titulo,
                artista_original
              )
            `)
            .eq("setlist_id", activeSetlist.id)
            .order("ordem", { ascending: true });

          if (setlistMusicas) {
            const formattedMusicas = setlistMusicas
              .filter((sm) => sm.musicas_repertorio)
              .map((sm) => ({
                id: (sm.musicas_repertorio as any).id,
                titulo: (sm.musicas_repertorio as any).titulo,
                artista_original: (sm.musicas_repertorio as any).artista_original,
              }));
            setMusicas(formattedMusicas);
          }
        } else {
          // Get full repertoire
          const { data: repertorio } = await supabase
            .from("musicas_repertorio")
            .select("id, titulo, artista_original")
            .eq("artista_id", artistaId)
            .order("titulo", { ascending: true });

          setMusicas(repertorio || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [artistaId]);

  // Accent-insensitive search
  const normalizeText = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredMusicas = useMemo(() => {
    if (!searchQuery.trim()) return musicas;
    const normalizedQuery = normalizeText(searchQuery);
    return musicas.filter(
      (m) =>
        normalizeText(m.titulo).includes(normalizedQuery) ||
        (m.artista_original && normalizeText(m.artista_original).includes(normalizedQuery))
    );
  }, [musicas, searchQuery]);

  const formatSocialLink = (handle: string | null, platform: 'instagram' | 'youtube' | 'spotify') => {
    if (!handle) return null;
    const cleanHandle = handle.replace(/^@/, '');
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${cleanHandle}`;
      case 'youtube':
        return handle.startsWith('http') ? handle : `https://youtube.com/@${cleanHandle}`;
      case 'spotify':
        return handle.startsWith('http') ? handle : `https://open.spotify.com/artist/${cleanHandle}`;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!artistaId || musicas.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-primary" />
          Repertório do Artista
          <Badge variant="secondary" className="ml-auto">
            {musicas.length} músicas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Artist Info Section */}
        {artista && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="w-14 h-14 border-2 border-primary/20">
              <AvatarImage src={artista.foto_url || undefined} />
              <AvatarFallback className="bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{artista.nome}</p>
              {artista.estilo_musical && (
                <Badge variant="outline" className="text-xs mt-1">
                  {artista.estilo_musical.toUpperCase()}
                </Badge>
              )}
              <div className="flex items-center gap-2 mt-2">
                {artista.instagram && (
                  <a
                    href={formatSocialLink(artista.instagram, 'instagram') || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {artista.youtube && (
                  <a
                    href={formatSocialLink(artista.youtube, 'youtube') || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {artista.spotify && (
                  <a
                    href={formatSocialLink(artista.spotify, 'spotify') || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar música..."
            className="pl-10"
          />
        </div>

        {/* Music List */}
        <ScrollArea className="h-64">
          {filteredMusicas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma música encontrada</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredMusicas.map((musica) => (
                <div
                  key={musica.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMusica === musica.titulo
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => onSelectMusica?.(musica)}
                >
                  <p className="font-medium text-sm">{musica.titulo}</p>
                  {musica.artista_original && (
                    <p className="text-xs text-muted-foreground">
                      {musica.artista_original}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
