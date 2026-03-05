import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode } from "lucide-react";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCard: () => void;
  onSelectPix: () => void;
  planName: string;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  onSelectCard,
  onSelectPix,
  planName,
}: PaymentMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Como deseja pagar?</DialogTitle>
          <DialogDescription>
            Escolha a forma de pagamento para o plano {planName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-2">
          <Button
            size="lg"
            className="w-full gap-3 h-16 text-base bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            onClick={() => {
              onOpenChange(false);
              onSelectCard();
            }}
          >
            <CreditCard className="w-5 h-5" />
            Cartão de Crédito
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-3 h-16 text-base"
            onClick={() => {
              onOpenChange(false);
              onSelectPix();
            }}
          >
            <QrCode className="w-5 h-5" />
            PIX (aprovação manual)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
