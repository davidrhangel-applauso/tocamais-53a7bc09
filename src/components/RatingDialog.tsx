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
import { Star, Music, Building2, ArrowRight } from "lucide-react";

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
  estabelecimentoNome?: string;
  showEstabelecimentoRating?: boolean;
}

const StarRating = ({
  rating,
  hoveredRating,
  onRate,
  onHover,
  onLeave,
}: {
  rating: number;
  hoveredRating: number;
  onRate: (star: number) => void;
  onHover: (star: number) => void;
  onLeave: () => void;
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className="p-1 transition-transform hover:scale-110"
        onMouseEnter={() => onHover(star)}
        onMouseLeave={onLeave}
        onClick={() => onRate(star)}
      >
        <Star
          className={`w-9 h-9 ${
            star <= (hoveredRating || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground'
          }`}
        />
      </button>
    ))}
  </div>
);

const ratingLabels: Record<number, string> = {
  0: "Clique para avaliar",
  1: "Ruim",
  2: "Regular",
  3: "Bom",
  4: "Muito bom",
  5: "Excelente!",
};

export const RatingDialog = ({
  open,
  onOpenChange,
  checkin,
  sessionId,
  estabelecimentoId,
  estabelecimentoNome,
  showEstabelecimentoRating = false,
}: RatingDialogProps) => {
  // Step: 'artista' or 'estabelecimento'
  const [step, setStep] = useState<'artista' | 'estabelecimento'>('artista');

  // Artist rating
  const [artistRating, setArtistRating] = useState(0);
  const [artistHover, setArtistHover] = useState(0);
  const [artistComment, setArtistComment] = useState("");

  // Establishment rating
  const [estabRating, setEstabRating] = useState(0);
  const [estabHover, setEstabHover] = useState(0);
  const [estabComment, setEstabComment] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const resetState = () => {
    setStep('artista');
    setArtistRating(0);
    setArtistHover(0);
    setArtistComment("");
    setEstabRating(0);
    setEstabHover(0);
    setEstabComment("");
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const submitArtistRating = async () => {
    if (artistRating === 0 || !checkin) return;

    try {
      const { error } = await supabase
        .from('avaliacoes_artistas')
        .insert({
          estabelecimento_id: estabelecimentoId,
          checkin_id: checkin.id,
          artista_id: checkin.artista_id,
          artista_nome: checkin.artista_nome,
          session_id: sessionId,
          nota: artistRating,
          comentario: artistComment.trim() || null,
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error submitting artist rating:', error);
      toast.error("Erro ao enviar avaliação do artista.");
      return false;
    }
  };

  const submitEstabRating = async () => {
    if (estabRating === 0) return true; // skip if not rated

    try {
      const { error } = await supabase
        .from('avaliacoes_estabelecimentos' as any)
        .insert({
          estabelecimento_id: estabelecimentoId,
          session_id: sessionId,
          nota: estabRating,
          comentario: estabComment.trim() || null,
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error submitting establishment rating:', error);
      toast.error("Erro ao enviar avaliação do estabelecimento.");
      return false;
    }
  };

  const handleSubmitArtist = async () => {
    if (artistRating === 0) {
      toast.error("Selecione uma nota");
      return;
    }

    setSubmitting(true);
    const success = await submitArtistRating();
    setSubmitting(false);

    if (success) {
      if (showEstabelecimentoRating && estabelecimentoNome) {
        toast.success("Avaliação do artista enviada!");
        setStep('estabelecimento');
      } else {
        toast.success("Avaliação enviada! Obrigado pelo feedback.");
        handleClose(false);
      }
    }
  };

  const handleSubmitEstab = async () => {
    if (estabRating === 0) {
      toast.error("Selecione uma nota");
      return;
    }

    setSubmitting(true);
    const success = await submitEstabRating();
    setSubmitting(false);

    if (success) {
      toast.success("Obrigado pelas avaliações! 🎉");
      handleClose(false);
    }
  };

  const artistaName = checkin?.artista_nome || 'o artista';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'artista' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Avalie {artistaName}
              </DialogTitle>
              <DialogDescription>
                Como foi a apresentação? Sua opinião é importante!
                {showEstabelecimentoRating && (
                  <span className="block mt-1 text-xs">Etapa 1 de 2</span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-2">
                <StarRating
                  rating={artistRating}
                  hoveredRating={artistHover}
                  onRate={setArtistRating}
                  onHover={setArtistHover}
                  onLeave={() => setArtistHover(0)}
                />
                <p className="text-sm text-muted-foreground">{ratingLabels[artistRating]}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="artist-comment">Comentário (opcional)</Label>
                <Textarea
                  id="artist-comment"
                  value={artistComment}
                  onChange={(e) => setArtistComment(e.target.value)}
                  placeholder="Deixe um recado para o artista..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleClose(false)}
                >
                  Pular
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitArtist}
                  disabled={artistRating === 0 || submitting}
                >
                  {submitting ? "Enviando..." : (
                    showEstabelecimentoRating ? (
                      <>
                        Avançar
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    ) : "Enviar Avaliação"
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Avalie {estabelecimentoNome || 'o estabelecimento'}
              </DialogTitle>
              <DialogDescription>
                Como foi sua experiência no local?
                <span className="block mt-1 text-xs">Etapa 2 de 2</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-2">
                <StarRating
                  rating={estabRating}
                  hoveredRating={estabHover}
                  onRate={setEstabRating}
                  onHover={setEstabHover}
                  onLeave={() => setEstabHover(0)}
                />
                <p className="text-sm text-muted-foreground">{ratingLabels[estabRating]}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estab-comment">Comentário (opcional)</Label>
                <Textarea
                  id="estab-comment"
                  value={estabComment}
                  onChange={(e) => setEstabComment(e.target.value)}
                  placeholder="O que achou do local?"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    toast.success("Obrigado pela avaliação do artista! 🎉");
                    handleClose(false);
                  }}
                >
                  Pular
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitEstab}
                  disabled={estabRating === 0 || submitting}
                >
                  {submitting ? "Enviando..." : "Enviar Avaliação"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
