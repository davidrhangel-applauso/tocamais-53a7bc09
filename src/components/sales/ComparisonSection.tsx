import { Check, X } from "lucide-react";

const features = [
  { name: "Receber gorjetas", free: true, pro: true },
  { name: "Perfil de artista", free: true, pro: true },
  { name: "Pedidos de música", free: true, pro: true },
  { name: "Taxa da plataforma", free: "20%", pro: "0%" },
  { name: "PIX direto na sua conta", free: false, pro: true },
  { name: "QR Code personalizado", free: false, pro: true },
  { name: "Destaque na busca", free: false, pro: true },
  { name: "Analytics completo", free: false, pro: true },
  { name: "Suporte prioritário", free: false, pro: true },
];

export function ComparisonSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Free vs{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PRO
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Compare e veja tudo que você ganha com o PRO
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-muted/50">
              <div className="p-4"></div>
              <div className="p-4 text-center border-l border-border">
                <p className="font-bold text-lg">Free</p>
                <p className="text-sm text-muted-foreground">R$ 0</p>
              </div>
              <div className="p-4 text-center border-l border-primary/50 bg-primary/10">
                <p className="font-bold text-lg text-primary">PRO</p>
                <p className="text-sm text-primary">R$ 19,90/mês</p>
              </div>
            </div>

            {/* Features */}
            {features.map((feature, index) => (
              <div
                key={index}
                className="grid grid-cols-3 border-t border-border"
              >
                <div className="p-4 flex items-center">
                  <span className="font-medium">{feature.name}</span>
                </div>
                <div className="p-4 flex items-center justify-center border-l border-border">
                  {typeof feature.free === "boolean" ? (
                    feature.free ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground" />
                    )
                  ) : (
                    <span className="text-destructive font-semibold">{feature.free}</span>
                  )}
                </div>
                <div className="p-4 flex items-center justify-center border-l border-primary/50 bg-primary/5">
                  {typeof feature.pro === "boolean" ? (
                    feature.pro ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground" />
                    )
                  ) : (
                    <span className="text-green-500 font-semibold">{feature.pro}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ROI Message */}
          <div className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 text-center">
            <p className="text-lg">
              💡 Se você recebe <span className="font-bold">R$ 100/mês</span> em gorjetas, 
              o PRO <span className="text-primary font-bold">se paga em 1 show!</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
