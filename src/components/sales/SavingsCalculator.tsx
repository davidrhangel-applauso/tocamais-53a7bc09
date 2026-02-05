import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";

interface SavingsCalculatorProps {
  onCTAClick: () => void;
}

export function SavingsCalculator({ onCTAClick }: SavingsCalculatorProps) {
  const [monthlyTips, setMonthlyTips] = useState<number>(300);
  
  const monthlyFee = monthlyTips * 0.20;
  const yearlyFee = monthlyFee * 12;
  const proMonthlyPrice = 19.90;
  const netSavingsMonthly = monthlyFee - proMonthlyPrice;
  const netSavingsYearly = netSavingsMonthly * 12;

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
              <Calculator className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Calculadora de Economia
            </h2>
            <p className="text-xl text-muted-foreground">
              Descubra quanto você pode economizar com o PRO
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            {/* Input */}
            <div className="mb-8">
              <Label htmlFor="tips" className="text-lg font-semibold mb-3 block">
                Quanto você recebe em gorjetas por mês?
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                  R$
                </span>
                <Input
                  id="tips"
                  type="number"
                  value={monthlyTips}
                  onChange={(e) => setMonthlyTips(Number(e.target.value) || 0)}
                  className="pl-12 text-2xl h-14 font-bold"
                  min={0}
                  step={50}
                />
              </div>
              <div className="flex gap-2 mt-3">
                {[100, 300, 500, 1000].map((value) => (
                  <button
                    key={value}
                    onClick={() => setMonthlyTips(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      monthlyTips === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    R$ {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Without PRO */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-2">Sem PRO (20% taxa)</p>
                <p className="text-2xl font-bold text-destructive mb-1">
                  - {formatCurrency(monthlyFee)}/mês
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(yearlyFee)} perdidos por ano
                </p>
              </div>

              {/* With PRO */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-2">Com PRO (0% taxa)</p>
                <p className="text-2xl font-bold text-green-500 mb-1">
                  + {formatCurrency(netSavingsMonthly > 0 ? netSavingsMonthly : 0)}/mês
                </p>
                <p className="text-sm text-muted-foreground">
                  de economia líquida
                </p>
              </div>
            </div>

            {/* Highlight */}
            {netSavingsYearly > 0 && (
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl p-6 mb-8 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-lg">
                  Você economizaria{" "}
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(netSavingsYearly)}
                  </span>{" "}
                  por ano com PRO!
                </p>
              </div>
            )}

            {/* CTA */}
            <Button
              onClick={onCTAClick}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground py-6 text-lg font-bold rounded-xl"
            >
              Quero Economizar
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
