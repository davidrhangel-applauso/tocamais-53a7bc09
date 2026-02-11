import { MessageCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialShareButtonsProps {
  className?: string;
}

export function SocialShareButtons({ className = "" }: SocialShareButtonsProps) {
  const shareText = "Confira o Toca Mais! Ganhe gorjetas como artista musical. Cadastro grátis! 🎵";
  const shareUrl = "https://tocamais.app";

  const handleWhatsAppShare = () => {
    const encodedText = encodeURIComponent(
      `${shareText}\n\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
  };

  const handleInstagramShare = () => {
    // Instagram não permite deep link direto de texto, então abrimos o app/site
    window.open("https://instagram.com", "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsAppShare}
        className="flex items-center gap-2 border-green-500/50 text-green-600 hover:bg-green-500/10"
        title="Compartilhar no WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstagramShare}
        className="flex items-center gap-2 border-pink-500/50 text-pink-600 hover:bg-pink-500/10"
        title="Compartilhar no Instagram"
      >
        <Instagram className="w-4 h-4" />
        <span className="hidden sm:inline">Instagram</span>
      </Button>
    </div>
  );
}
