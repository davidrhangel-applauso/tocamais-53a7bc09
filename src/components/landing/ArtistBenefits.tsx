import { 
  Wallet, 
  Music, 
  QrCode, 
  User, 
  BarChart3, 
  Search,
  Zap,
  Shield
} from "lucide-react";

const benefits = [
  {
    icon: Wallet,
    title: "Gorjetas via PIX",
    description: "Receba gorjetas instantaneamente na sua conta. Zero burocracia.",
    highlight: "Recebimento imediato",
  },
  {
    icon: Music,
    title: "Pedidos de Música",
    description: "Clientes pedem músicas do seu repertório em tempo real.",
    highlight: "Interação ao vivo",
  },
  {
    icon: QrCode,
    title: "QR Code Personalizado",
    description: "Gere seu QR Code único para clientes te encontrarem facilmente.",
    highlight: "Fácil compartilhar",
  },
  {
    icon: User,
    title: "Perfil Profissional",
    description: "Mostre seu trabalho com foto, bio, redes sociais e repertório.",
    highlight: "Sua vitrine digital",
  },
  {
    icon: BarChart3,
    title: "Analytics de Performance",
    description: "Acompanhe quantas gorjetas e pedidos você recebe.",
    highlight: "Dados em tempo real",
  },
  {
    icon: Search,
    title: "Visibilidade na Busca",
    description: "Apareça para clientes próximos quando estiver tocando ao vivo.",
    highlight: "Mais visibilidade",
  },
];

const extraBenefits = [
  {
    icon: Zap,
    text: "Ativação instantânea do modo 'Ao Vivo'",
  },
  {
    icon: Shield,
    text: "Pagamentos seguros via Mercado Pago",
  },
];

export function ArtistBenefits() {
  return (
    <section className="py-16 sm:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              crescer
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais para artistas independentes
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">
                    {benefit.highlight}
                  </span>
                  <h3 className="text-lg font-bold mb-1">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Extra benefits strip */}
        <div className="flex flex-wrap justify-center gap-6 py-6 px-4 bg-muted/50 rounded-xl">
          {extraBenefits.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <item.icon className="w-4 h-4 text-green-500" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
