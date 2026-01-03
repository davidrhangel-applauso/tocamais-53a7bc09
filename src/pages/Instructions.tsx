import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Music, 
  QrCode, 
  DollarSign, 
  Users, 
  Bell, 
  Settings,
  MapPin,
  MessageCircle,
  Star,
  CheckCircle,
  Smartphone,
  Share2,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Instructions = () => {
  const navigate = useNavigate();

  const artistSections = [
    {
      icon: <QrCode className="h-5 w-5 text-primary" />,
      title: "Como receber gorjetas",
      content: `1. Ative o modo "Ao Vivo" no seu painel para aparecer nos resultados de busca
2. Compartilhe seu QR Code ou link do perfil com o público
3. Os fãs podem escanear e enviar gorjetas via PIX
4. Você recebe notificações em tempo real de cada gorjeta`
    },
    {
      icon: <Music className="h-5 w-5 text-primary" />,
      title: "Gerenciando seu repertório",
      content: `1. Acesse a aba "Repertório" no painel
2. Adicione músicas manualmente ou importe uma lista
3. Para importar em lote: use texto (uma música por linha) ou arquivo CSV
4. Formatos aceitos: "Título - Artista" ou apenas "Título"
5. Seu repertório ajuda os fãs a fazerem pedidos de músicas`
    },
    {
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      title: "Pedidos de músicas com pagamento",
      content: `1. Fãs podem pedir músicas junto com uma gorjeta
2. Os pedidos aparecem na aba "Pendentes"
3. Você pode aceitar, recusar ou marcar como concluído
4. O valor da gorjeta é liberado automaticamente via PIX`
    },
    {
      icon: <MapPin className="h-5 w-5 text-primary" />,
      title: "Localização e descoberta",
      content: `1. Configure sua localização nas Configurações
2. Quando "Ao Vivo", fãs próximos podem encontrar você
3. O raio de busca padrão é de 50km
4. Mantenha sua localização atualizada para mais visibilidade`
    },
    {
      icon: <Star className="h-5 w-5 text-primary" />,
      title: "Plano PRO",
      content: `Com o plano PRO você tem:
• 0% de taxa nas gorjetas (vs 20% no plano gratuito)
• Destaque nos resultados de busca
• Relatórios avançados
• Suporte prioritário

Assine diretamente pelo app em Configurações`
    },
  ];

  const fanSections = [
    {
      icon: <Users className="h-5 w-5 text-primary" />,
      title: "Encontrando artistas",
      content: `1. Use a busca para encontrar artistas por nome
2. Ative a localização para ver artistas próximos
3. Filtre por estilo musical
4. Artistas "Ao Vivo" estão se apresentando agora!`
    },
    {
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      title: "Enviando gorjetas",
      content: `1. Acesse o perfil do artista
2. Clique em "Enviar Gorjeta"
3. Escolha ou digite um valor
4. Opcionalmente, peça uma música
5. Escaneie o QR Code PIX e pague
6. O artista recebe sua gorjeta instantaneamente!`
    },
    {
      icon: <Music className="h-5 w-5 text-primary" />,
      title: "Pedindo músicas",
      content: `1. Ao enviar uma gorjeta, você pode pedir uma música
2. Escolha do repertório do artista ou escreva sua sugestão
3. Adicione uma mensagem especial se quiser
4. O artista verá seu pedido e pode tocar sua música!`
    },
    {
      icon: <MessageCircle className="h-5 w-5 text-primary" />,
      title: "Mensagens",
      content: `1. Você pode enviar mensagens para artistas
2. Acesse "Conversas" para ver suas mensagens
3. Receba notificações de respostas`
    },
  ];

  const generalSections = [
    {
      icon: <Smartphone className="h-5 w-5 text-primary" />,
      title: "Instalando o app",
      content: `O TocaMais funciona como um app no seu celular:

iPhone:
1. Abra no Safari
2. Toque em "Compartilhar" 
3. Selecione "Adicionar à Tela de Início"

Android:
1. Abra no Chrome
2. Toque no menu (3 pontos)
3. Selecione "Instalar app" ou "Adicionar à tela inicial"`
    },
    {
      icon: <Bell className="h-5 w-5 text-primary" />,
      title: "Notificações",
      content: `1. Permita notificações quando solicitado
2. Receba alertas de gorjetas, pedidos e mensagens
3. Configure preferências em "Configurações"
4. O sino no painel mostra notificações não lidas`
    },
    {
      icon: <Settings className="h-5 w-5 text-primary" />,
      title: "Configurações da conta",
      content: `Em Configurações você pode:
• Editar seu perfil e foto
• Configurar chave PIX (artistas)
• Gerenciar localização
• Alterar tema (claro/escuro)
• Ver histórico de pagamentos`
    },
    {
      icon: <Share2 className="h-5 w-5 text-primary" />,
      title: "Compartilhando seu perfil",
      content: `Artistas podem compartilhar seu perfil:
1. Acesse seu perfil público
2. Copie o link ou baixe o QR Code
3. Compartilhe nas redes sociais
4. Imprima o QR Code para shows!`
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Como usar o TocaMais</h1>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-2xl mx-auto space-y-8">
        {/* Intro */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Bem-vindo ao TocaMais!</h2>
              <p className="text-muted-foreground text-sm">
                Conectamos artistas de rua e fãs através de gorjetas digitais e pedidos de músicas. 
                Confira abaixo como aproveitar ao máximo a plataforma.
              </p>
            </div>
          </div>
        </Card>

        {/* Para Artistas */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Music className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Para Artistas</h2>
          </div>
          <Card className="p-4">
            <Accordion type="single" collapsible className="w-full">
              {artistSections.map((section, index) => (
                <AccordionItem key={index} value={`artist-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line pl-8">
                      {section.content}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* Para Fãs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Para Fãs</h2>
          </div>
          <Card className="p-4">
            <Accordion type="single" collapsible className="w-full">
              {fanSections.map((section, index) => (
                <AccordionItem key={index} value={`fan-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line pl-8">
                      {section.content}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* Geral */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Dicas Gerais</h2>
          </div>
          <Card className="p-4">
            <Accordion type="single" collapsible className="w-full">
              {generalSections.map((section, index) => (
                <AccordionItem key={index} value={`general-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line pl-8">
                      {section.content}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* Quick Actions */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/buscar")}>
              <Users className="h-4 w-4 mr-2" />
              Buscar Artistas
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/configuracoes")}>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/painel")}>
              <Music className="h-4 w-4 mr-2" />
              Painel do Artista
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/conversas")}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Mensagens
            </Button>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-8">
          Dúvidas? Entre em contato pelo suporte do app.
        </p>
      </main>
    </div>
  );
};

export default Instructions;
