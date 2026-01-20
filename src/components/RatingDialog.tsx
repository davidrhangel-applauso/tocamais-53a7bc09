import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star } from "lucide-react";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkin: {
    id: string;
    artista_id: string | null;
    artista_nome: string | null;
  } | null;
  sessionId: string;
  estabelecimentoId: string;
}

export const RatingDialog = ({
  open,
  onOpenChange,
  checkin,
  sessionId,
  estabelecimentoId,
}: RatingDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma nota");
      return;
    }

    if (!checkin) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('avaliacoes_artistas')
        .insert({
          estabelecimento_id: estabelecimentoId,
          checkin_id: checkin.id,
          artista_id: checkin.artista_id,
          artista_nome: checkin.artista_nome,
          session_id: sessionId,
          nota: rating,
          comentario: comentario.trim() || null,
        });

      if (error) throw error;

      toast.success("Avaliação enviada! Obrigado pelo feedback.");
      onOpenChange(false);
      setRating(0);
      setComentario("");
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const artistaName = checkin?.artista_nome || 'o artista';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avalie {artistaName}</DialogTitle>
          <DialogDescription>
            Como foi a apresentação? Sua opinião é importante!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {rating === 1 && "Ruim"}
              {rating === 2 && "Regular"}
              {rating === 3 && "Bom"}
              {rating === 4 && "Muito bom"}
              {rating === 5 && "Excelente!"}
              {rating === 0 && "Clique para avaliar"}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comentario">Comentário (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Deixe um recado para o artista..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Pular
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              {submitting ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
