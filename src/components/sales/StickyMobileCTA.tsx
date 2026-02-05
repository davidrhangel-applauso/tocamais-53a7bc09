import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface StickyMobileCTAProps {
  onCTAClick: () => void;
}

export function StickyMobileCTA({ onCTAClick }: StickyMobileCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-area-inset-bottom">
      <Button
        onClick={onCTAClick}
        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground py-6 text-lg font-bold rounded-xl"
      >
        Assinar PRO Agora
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
      <p className="text-center text-xs text-muted-foreground mt-2">
        A partir de R$ 19,90/mês • Cancele quando quiser
      </p>
    </div>
  );
}
