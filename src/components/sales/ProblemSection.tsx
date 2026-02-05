import { AlertTriangle, TrendingDown, DollarSign } from "lucide-react";

export function ProblemSection() {
  return (
    <section className="py-20 bg-destructive/5 border-y border-destructive/20">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Você está{" "}
            <span className="text-destructive">perdendo dinheiro</span> a cada show
          </h2>

          {/* Pain Points */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-card p-6 rounded-xl border border-destructive/20">
              <TrendingDown className="w-10 h-10 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Taxa de 20%</p>
              <p className="text-muted-foreground text-sm">
                No plano Free, você perde 20% de cada gorjeta
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-destructive/20">
              <DollarSign className="w-10 h-10 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Dinheiro que não volta</p>
              <p className="text-muted-foreground text-sm">
                Taxas que poderiam estar no seu bolso
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-destructive/20">
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Prejuízo mensal</p>
              <p className="text-muted-foreground text-sm">
                Quanto mais você ganha, mais você perde
              </p>
            </div>
          </div>

          {/* Visual Calculation */}
          <div className="bg-card border border-border rounded-2xl p-8 max-w-xl mx-auto">
            <p className="text-muted-foreground mb-4">Veja o impacto:</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">R$ 500</p>
                <p className="text-sm text-muted-foreground">gorjetas/mês</p>
              </div>
              <span className="text-2xl text-muted-foreground">→</span>
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">- R$ 100</p>
                <p className="text-sm text-muted-foreground">em taxas</p>
              </div>
              <span className="text-2xl text-muted-foreground">=</span>
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">R$ 400</p>
                <p className="text-sm text-muted-foreground">você recebe</p>
              </div>
            </div>
            <p className="mt-6 text-destructive font-semibold">
              Isso são R$ 1.200 perdidos por ano!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
