import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface StickyHeaderCTAProps {
  onArtistClick: () => void;
}

export function StickyHeaderCTA({ onArtistClick }: StickyHeaderCTAProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar sticky header após rolar 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-black/95 border-b border-primary/30 backdrop-blur-md z-40 py-3 px-4 sm:px-6 animate-fade-in">
      <div className="container mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white hidden sm:inline">Toca Mais</span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/auth")}
            className="text-xs sm:text-sm border-white/20 hover:bg-white/10"
          >
            Cadastro Grátis
          </Button>
          <Button
            size="sm"
            onClick={onArtistClick}
            className="text-xs sm:text-sm bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
          >
            Assinar PRO
          </Button>
        </div>
      </div>
    </div>
  );
}
