import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Navigation, Music } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type MusicStyle = Database['public']['Enums']['music_style'];

interface NearbyArtist {
  id: string;
  nome: string;
  foto_url: string | null;
  cidade: string | null;
  estilo_musical: MusicStyle | null;
  bio: string | null;
  distance_km: number;
}

// ID do administrador que deve ser ocultado da lista de artistas
const ADMIN_USER_ID = "0120d3e5-2c0c-4115-a27f-94dcf5e7ae7d";

export const NearbyArtists = () => {
  const navigate = useNavigate();
  const { getCurrentPosition, loading: geoLoading, error: geoError } = useGeolocation();
  const [artists, setArtists] = useState<NearbyArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const searchNearbyArtists = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentPosition();
      setUserLocation({ lat: coords.latitude, lng: coords.longitude });
      
      const { data, error } = await supabase.rpc('get_nearby_live_artists', {
        user_lat: coords.latitude,
        user_lon: coords.longitude,
        max_distance_km: 50
      });

      if (error) throw error;
      // Filtrar o administrador dos resultados
      const filteredData = (data || []).filter(artist => artist.id !== ADMIN_USER_ID);
      setArtists(filteredData);
      setHasSearched(true);
    } catch (error: any) {
      console.error('Error searching nearby artists:', error);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  if (!hasSearched) {
    return (
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-primary to-primary-glow rounded-2xl shadow-xl">
              <Navigation className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Artistas ao Vivo Perto de Você
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Permita o acesso à sua localização para encontrar artistas tocando ao vivo na sua região
          </p>
          
          <Button
            size="lg"
            onClick={searchNearbyArtists}
            disabled={loading || geoLoading}
            className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            {(loading || geoLoading) ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 mr-2" />
                Encontrar Artistas Próximos
              </>
            )}
          </Button>

          {geoError && (
            <p className="text-sm text-destructive mt-4">{geoError}</p>
          )}
        </div>
      </section>
    );
  }

  if (artists.length === 0) {
    return (
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-muted rounded-2xl">
              <Music className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">
            Nenhum Artista ao Vivo por Perto
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Não encontramos artistas ao vivo em um raio de 50km. Tente novamente mais tarde ou explore todos os artistas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={searchNearbyArtists}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Buscar Novamente
            </Button>
            
            <Button onClick={() => navigate('/buscar')}>
              Ver Todos os Artistas
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-500/20 rounded-full animate-pulse">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-foreground">
            Artistas ao Vivo Perto de Você
          </h2>
          
          <p className="text-muted-foreground">
            {artists.length} artista{artists.length > 1 ? 's' : ''} encontrado{artists.length > 1 ? 's' : ''} em um raio de 50km
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {artists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => navigate(`/artista/${artist.id}`)}
              className="group bg-card border border-border rounded-2xl p-5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                  <AvatarImage src={artist.foto_url || ''} alt={artist.nome} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {artist.nome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                      {artist.nome}
                    </h3>
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Ao Vivo
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-medium text-primary">{formatDistance(artist.distance_km)}</span>
                    {artist.cidade && (
                      <>
                        <span>•</span>
                        <span className="truncate">{artist.cidade}</span>
                      </>
                    )}
                  </div>
                  
                  {artist.estilo_musical && (
                    <Badge variant="secondary" className="text-xs">
                      {artist.estilo_musical}
                    </Badge>
                  )}
                </div>
              </div>
              
              {artist.bio && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {artist.bio}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={searchNearbyArtists}
            disabled={loading}
            className="mr-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 mr-2" />
            )}
            Atualizar
          </Button>
          
          <Button onClick={() => navigate('/buscar')}>
            Ver Todos os Artistas
          </Button>
        </div>
      </div>
    </section>
  );
};
