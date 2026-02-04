import { Search, Music, Heart, UserPlus, Guitar, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StepCard = ({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="relative group">
    {/* Step number */}
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg z-10">
      {step}
    </div>

    <div className="pt-6 p-6 bg-card border border-border rounded-2xl hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 h-full">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
      <p className="text-muted-foreground text-center text-sm">{description}</p>
    </div>
  </div>
);

const ConnectorLine = () => (
  <div className="hidden md:flex items-center justify-center">
    <div className="w-16 h-0.5 bg-gradient-to-r from-primary to-accent" />
  </div>
);

export const HowItWorksSection = () => {
  const clientSteps = [
    {
      icon: Search,
      title: "Encontre",
      description: "Busque artistas próximos ou pelo nome",
    },
    {
      icon: Music,
      title: "Peça",
      description: "Escolha a música que quer ouvir ao vivo",
    },
    {
      icon: Heart,
      title: "Apoie",
      description: "Envie uma gorjeta via PIX instantâneo",
    },
  ];

  const artistSteps = [
    {
      icon: UserPlus,
      title: "Cadastre",
      description: "Crie seu perfil artístico em minutos",
    },
    {
      icon: Guitar,
      title: "Toque",
      description: "Receba pedidos de música em tempo real",
    },
    {
      icon: Wallet,
      title: "Receba",
      description: "Gorjetas caem direto na sua conta PIX",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Como Funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simples, rápido e direto. Comece em 3 passos.
          </p>
        </div>

        <Tabs defaultValue="client" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
            <TabsTrigger value="client" className="text-base">
              Para Clientes
            </TabsTrigger>
            <TabsTrigger value="artist" className="text-base">
              Para Artistas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-0 items-stretch">
              <div className="md:col-span-1">
                <StepCard step={1} {...clientSteps[0]} />
              </div>
              <ConnectorLine />
              <div className="md:col-span-1">
                <StepCard step={2} {...clientSteps[1]} />
              </div>
              <ConnectorLine />
              <div className="md:col-span-1">
                <StepCard step={3} {...clientSteps[2]} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="artist" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-0 items-stretch">
              <div className="md:col-span-1">
                <StepCard step={1} {...artistSteps[0]} />
              </div>
              <ConnectorLine />
              <div className="md:col-span-1">
                <StepCard step={2} {...artistSteps[1]} />
              </div>
              <ConnectorLine />
              <div className="md:col-span-1">
                <StepCard step={3} {...artistSteps[2]} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
