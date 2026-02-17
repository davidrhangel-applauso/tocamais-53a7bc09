import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Crown, Wallet, Zap, QrCode } from "lucide-react";

interface FreeLimitReachedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FreeLimitReachedModal = ({ open, onOpenChange }: FreeLimitReachedModalProps) => {
  const navigate = useNavigate();

  const benefits = [
    { icon: Wallet, text: "0% de taxa – receba 100% das gorjetas" },
    { icon: Zap, text: "PIX direto na sua conta, sem intermediários" },
    { icon: QrCode, text: "QR Code inteligente para seus fãs" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
            <Crown className="w-7 h-7 text-black" />
          </div>
          <DialogTitle className="text-xl">Limite de gorjetas atingido!</DialogTitle>
          <DialogDescription className="text-base">
            Você atingiu o limite de R$ 10,00 em gorjetas gratuitas. Assine o PRO para continuar recebendo sem limites.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold hover:opacity-90"
            size="lg"
            onClick={() => {
              onOpenChange(false);
              navigate("/pro-sales");
            }}
          >
            <Crown className="w-5 h-5 mr-2" />
            Assinar PRO Agora
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
