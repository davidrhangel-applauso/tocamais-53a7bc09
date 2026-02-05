import { 
  Percent, 
  QrCode, 
  Star, 
  BarChart3, 
  Zap,
  Shield
} from "lucide-react";

const benefits = [
  {
    icon: Percent,
    title: "0% de Taxa",
    description: "Receba 100% de cada gorjeta. Sem descontos, sem surpresas.",
    highlight: "vs 20% no Free",
    color: "text-green-500",
  },
  {
    icon: QrCode,
    title: "PIX Direto",
    description: "Configure seu PIX pessoal. Dinheiro cai direto na sua conta.",
    highlight: "Sem intermediários",
    color: "text-primary",
  },
  {
    icon: Star,
    title: "Destaque na Busca",
    description: "Apareça primeiro quando clientes buscam artistas na região.",
    highlight: "Mais visibilidade",
    color: "text-accent",
  },
  {
    icon: BarChart3,
    title: "Analytics Completo",
    description: "Relatórios detalhados de ganhos, pedidos e performance.",
    highlight: "Dados em tempo real",
    color: "text-blue-500",
  },
  {
    icon: Zap,
    title: "Ativação Imediata",
    description: "Seu plano PRO é ativado instantaneamente após o pagamento.",
    highlight: "Sem espera",
    color: "text-yellow-500",
  },
  {
    icon: Shield,
    title: "Suporte Prioritário",
    description: "Atendimento rápido e exclusivo para artistas PRO.",
    highlight: "Resposta em até 24h",
    color: "text-purple-500",
  },
];

export function SolutionSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            A Solução{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PRO
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para maximizar seus ganhos e crescer como artista
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4 group-hover:scale-110 transition-transform ${benefit.color}`}>
                <benefit.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground mb-3">{benefit.description}</p>
              
              <span className={`inline-block text-sm font-semibold ${benefit.color} bg-muted px-3 py-1 rounded-full`}>
                {benefit.highlight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
