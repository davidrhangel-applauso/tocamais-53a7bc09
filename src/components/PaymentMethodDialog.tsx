import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, QrCode, Sparkles } from "lucide-react";
import { STRIPE_PLANS, type PlanKey } from "@/lib/stripe-plans";

const planKeys: PlanKey[] = ["mensal", "anual", "bienal"];

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCard: () => void;
  onSelectPix: () => void;
  planName: string;
  selectedPlanKey: PlanKey;
  onPlanChange: (key: PlanKey) => void;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  onSelectCard,
  onSelectPix,
  planName,
  selectedPlanKey,
  onPlanChange,
}: PaymentMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha seu plano e forma de pagamento</DialogTitle>
          <DialogDescription>
            Selecione o plano desejado e a forma de pagamento
          </DialogDescription>
        </DialogHeader>

        {/* Plan selection */}
        <div className="grid gap-2">
          {planKeys.map((key) => {
            const plan = STRIPE_PLANS[key];
            const isSelected = key === selectedPlanKey;
            return (
              <button
                key={key}
                onClick={() => onPlanChange(key)}
                className={`relative flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-primary" : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{plan.name}</span>
                      {plan.recommended && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{plan.description}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm">
                    R$ {plan.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                  {plan.savings && (
                    <div className="text-[10px] text-green-500 font-medium">{plan.savings}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Payment method */}
        <div className="grid gap-3 mt-1">
          <p className="text-xs text-muted-foreground text-center">Forma de pagamento</p>
          <Button
            size="lg"
            className="w-full gap-3 h-14 text-base bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
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
            className="w-full gap-3 h-14 text-base"
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
