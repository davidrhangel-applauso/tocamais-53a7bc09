import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AuthRequiredDialog({ open, onOpenChange, onConfirm }: AuthRequiredDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Cadastro necessário</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Para assinar o plano PRO, você precisa criar uma conta ou fazer login primeiro.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleClose} className="w-full mt-4 gap-2" size="lg">
          <LogIn className="w-5 h-5" />
          Ir para Login / Cadastro
        </Button>
      </DialogContent>
    </Dialog>
  );
}
