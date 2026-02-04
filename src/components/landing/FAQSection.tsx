import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "O pagamento é seguro?",
    answer:
      "Sim! Todas as transações são realizadas via PIX, que é regulamentado pelo Banco Central do Brasil. Utilizamos criptografia de ponta a ponta para garantir a segurança dos seus dados.",
  },
  {
    question: "Quais são as taxas cobradas?",
    answer:
      "Para artistas no plano gratuito, a taxa é de 15% sobre cada gorjeta recebida. No plano PRO (R$ 29,90/mês), a taxa cai para apenas 7%. Clientes não pagam nenhuma taxa adicional.",
  },
  {
    question: "Como faço para começar como artista?",
    answer:
      "É muito simples! Crie sua conta, preencha seu perfil com foto e informações, configure sua chave PIX e pronto. Você já pode compartilhar seu QR Code e receber pedidos e gorjetas.",
  },
  {
    question: "Preciso criar conta para pedir música?",
    answer:
      "Não! Clientes podem pedir músicas e enviar gorjetas sem precisar criar conta. Basta escanear o QR Code do artista e fazer o pedido. Simples assim.",
  },
  {
    question: "Quanto tempo leva para receber as gorjetas?",
    answer:
      "As gorjetas são transferidas instantaneamente via PIX assim que o pagamento é confirmado. O dinheiro cai direto na conta cadastrada pelo artista.",
  },
  {
    question: "Posso usar em qualquer tipo de evento?",
    answer:
      "Sim! O Toca+ funciona perfeitamente em bares, restaurantes, casamentos, festas privadas, shows e qualquer evento com música ao vivo. Basta ter internet no celular.",
  },
  {
    question: "O estabelecimento paga algo?",
    answer:
      "Não! Estabelecimentos podem usar a plataforma gratuitamente. Eles se beneficiam oferecendo uma experiência melhor para seus clientes e atraindo mais público.",
  },
  {
    question: "Posso cancelar o plano PRO a qualquer momento?",
    answer:
      "Sim! Você pode cancelar sua assinatura PRO quando quiser, sem multas ou burocracia. Seu plano permanece ativo até o fim do período já pago.",
  },
];

export const FAQSection = () => {
  return (
    <section className="py-16 sm:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas sobre o Toca+
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-xl px-6 bg-card"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5">
                <span className="font-medium">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
