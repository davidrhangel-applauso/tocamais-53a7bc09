import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Search, ListMusic } from "lucide-react";

interface Musica {
  id: string;
  titulo: string;
  artista_original: string | null;
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchRepertorio = async () => {
      if (!artistaId) {
        setMusicas([]);
        setLoading(false);
        return;
      }

      try {
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
        console.error("Error fetching repertoire:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepertorio();
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

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-primary" />
          Repertório do Artista
          <Badge variant="secondary" className="ml-auto">
            {musicas.length} músicas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar música..."
            className="pl-10"
          />
        </div>

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
