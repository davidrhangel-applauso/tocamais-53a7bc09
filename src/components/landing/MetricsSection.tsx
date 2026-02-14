import { Wallet, Zap, QrCode } from "lucide-react";
import { SocialShareButtons } from "@/components/landing/SocialShareButtons";

const benefits = [
  {
    icon: Wallet,
    title: "100% das gorjetas no seu bolso",
    description: "Com plano PRO, sem taxas escondidas. Tudo que seus fãs enviam vai direto pra você.",
  },
  {
    icon: Zap,
    title: "Receba via PIX na hora",
    description: "Dinheiro cai direto na sua conta, sem burocracia e sem esperar dias.",
  },
  {
    icon: QrCode,
    title: "QR Code inteligente",
    description: "Seus fãs pedem músicas e enviam gorjetas com um único scan. Simples assim.",
  },
];

export function MetricsSection() {
  return (
    <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-primary/5 to-accent/5 border-y border-primary/20">
      <div className="container mx-auto max-w-6xl">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-8">
          Por que artistas escolhem o Toca+
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-primary/20 bg-card p-6 text-center flex flex-col items-center gap-3"
            >
              <div className="rounded-full bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">{title}</h4>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
              Compartilhe com seus amigos músicos!
            </h3>
            <p className="text-sm text-muted-foreground">
              Conhece alguém que deveria ganhar mais gorjetas?
            </p>
          </div>
          <SocialShareButtons />
        </div>
      </div>
    </section>
  );
}
