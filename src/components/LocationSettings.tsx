import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useGeolocation } from '@/hooks/useGeolocation';

interface LocationSettingsProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number | null, lng: number | null) => void;
}

export const LocationSettings = ({ latitude, longitude, onLocationChange }: LocationSettingsProps) => {
  const { getCurrentPosition, loading } = useGeolocation();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleGetLocation = async () => {
    setIsUpdating(true);
    try {
      const coords = await getCurrentPosition();
      onLocationChange(coords.latitude, coords.longitude);
      toast.success('Localização atualizada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao obter localização');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearLocation = () => {
    onLocationChange(null, null);
    toast.success('Localização removida');
  };

  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        <Label className="text-lg font-semibold">Localização GPS</Label>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Compartilhe sua localização para que clientes próximos possam encontrá-lo quando estiver ao vivo.
      </p>

      {hasLocation && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-400">
            Localização configurada
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant={hasLocation ? "outline" : "default"}
          onClick={handleGetLocation}
          disabled={loading || isUpdating}
          className="flex-1"
        >
          {(loading || isUpdating) ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Obtendo...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              {hasLocation ? 'Atualizar Localização' : 'Obter Minha Localização'}
            </>
          )}
        </Button>

        {hasLocation && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearLocation}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Sua localização exata não será mostrada aos clientes, apenas a distância aproximada.
      </p>
    </div>
  );
};
