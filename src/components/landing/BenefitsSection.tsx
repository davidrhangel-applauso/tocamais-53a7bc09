import {
  Wallet,
  Bell,
  QrCode,
  BarChart3,
  MapPin,
  Music,
  Heart,
  Zap,
  Shield,
  Users,
  Building2,
  Calendar,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BenefitCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const BenefitCard = ({ icon: Icon, title, description }: BenefitCardProps) => (
  <div className="group p-6 bg-card border border-border rounded-2xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  </div>
);

export const BenefitsSection = () => {
  const artistBenefits = [
    {
      icon: Wallet,
      title: "Gorjetas via PIX Instantâneo",
      description: "Receba o dinheiro direto na sua conta, sem intermediários",
    },
    {
      icon: Bell,
      title: "Pedidos em Tempo Real",
      description: "Notificações instantâneas quando alguém pede uma música",
    },
    {
      icon: QrCode,
      title: "QR Code Personalizado",
      description: "Compartilhe seu link e QR Code único em shows e redes sociais",
    },
    {
      icon: BarChart3,
      title: "Analytics de Performance",
      description: "Acompanhe suas gorjetas, pedidos e métricas de crescimento",
    },
    {
      icon: MapPin,
      title: "Destaque por Localização",
      description: "Apareça para clientes próximos quando estiver tocando ao vivo",
    },
    {
      icon: Music,
      title: "Repertório Digital",
      description: "Cadastre suas músicas e facilite os pedidos dos clientes",
    },
  ];

  const clientBenefits = [
    {
      icon: Music,
      title: "Peça Sua Música Favorita",
      description: "Escolha do repertório do artista ou faça um pedido especial",
    },
    {
      icon: Heart,
      title: "Apoie Diretamente",
      description: "100% da gorjeta vai para o artista, sem taxas ocultas",
    },
    {
      icon: Zap,
      title: "Sem Cadastro Necessário",
      description: "Peça músicas e envie gorjetas sem criar conta",
    },
    {
      icon: Shield,
      title: "Pagamento Seguro",
      description: "Transações via PIX com toda segurança e praticidade",
    },
    {
      icon: MapPin,
      title: "Encontre Artistas Próximos",
      description: "Descubra quem está tocando ao vivo perto de você",
    },
    {
      icon: Users,
      title: "Interaja ao Vivo",
      description: "Conecte-se com artistas durante as apresentações",
    },
  ];

  const establishmentBenefits = [
    {
      icon: Users,
      title: "Atraia Mais Clientes",
      description: "Música ao vivo de qualidade atrai e retém clientes",
    },
    {
      icon: Calendar,
      title: "Check-in de Artistas",
      description: "Controle quem está tocando no seu estabelecimento",
    },
    {
      icon: Building2,
      title: "Dashboard de Gestão",
      description: "Acompanhe pedidos e interações no seu local",
    },
    {
      icon: QrCode,
      title: "QR Code do Local",
      description: "Clientes acessam o artista atual escaneando o QR",
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Métricas de engajamento e satisfação dos clientes",
    },
    {
      icon: Zap,
      title: "100% Gratuito",
      description: "Sem custos para estabelecimentos utilizarem a plataforma",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Benefícios para Todos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa que conecta artistas, clientes e estabelecimentos
          </p>
        </div>

        <Tabs defaultValue="artists" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-12">
            <TabsTrigger value="artists" className="text-sm sm:text-base">
              Artistas
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-sm sm:text-base">
              Clientes
            </TabsTrigger>
            <TabsTrigger value="establishments" className="text-sm sm:text-base">
              Locais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artists" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artistBenefits.map((benefit, index) => (
                <BenefitCard key={index} {...benefit} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="clients" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientBenefits.map((benefit, index) => (
                <BenefitCard key={index} {...benefit} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="establishments" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {establishmentBenefits.map((benefit, index) => (
                <BenefitCard key={index} {...benefit} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
