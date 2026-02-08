import { Button } from "@/components/ui/button";
import { UserPlus, ListMusic, MapPin, Wallet, ArrowRight } from "lucide-react";

interface HowItWorksProps {
  onCTAClick: () => void;
}

const steps = [
  {
    icon: UserPlus,
    title: "Crie seu perfil",
    description: "Cadastro gratuito em menos de 2 minutos. Adicione sua foto e bio.",
    gradient: "from-primary to-primary-glow",
  },
  {
    icon: ListMusic,
    title: "Monte seu repertório",
    description: "Liste as músicas que você toca. Clientes podem escolher do seu repertório.",
    gradient: "from-primary-glow to-accent",
  },
  {
    icon: MapPin,
    title: "Faça check-in no show",
    description: "Quando estiver tocando, ative o modo 'Ao Vivo' para aparecer na busca.",
    gradient: "from-accent to-primary",
  },
  {
    icon: Wallet,
    title: "Receba gorjetas e pedidos",
    description: "Clientes enviam gorjetas via PIX e pedem suas músicas favoritas.",
    gradient: "from-primary to-accent",
  },
];

export function HowItWorks({ onCTAClick }: HowItWorksProps) {
  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Simples como tocar{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              sua música
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Em 4 passos você está pronto para receber gorjetas e pedidos
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent"></div>
              )}
              
              <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 h-full">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={onCTAClick}
            className="px-8 py-6 text-lg bg-gradient-to-r from-primary to-primary-glow hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105"
          >
            Começar Agora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
