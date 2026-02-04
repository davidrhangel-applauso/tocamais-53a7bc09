import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

interface StickyMobileCTAProps {
  onArtistClick: () => void;
}

export const StickyMobileCTA = ({ onArtistClick }: StickyMobileCTAProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section (approx 80% of viewport height)
      const scrollThreshold = window.innerHeight * 0.8;
      setIsVisible(window.scrollY > scrollThreshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-50 sm:hidden animate-fade-in">
      <Button
        size="lg"
        className="w-full py-6 bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg font-semibold"
        onClick={onArtistClick}
      >
        <Music className="mr-2 h-5 w-5" />
        Começar Agora
      </Button>
    </div>
  );
};
