import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "O cadastro é realmente gratuito?",
    answer: "Sim! Você pode criar sua conta e começar a receber gorjetas e pedidos de música sem pagar nada. No plano gratuito, cobramos apenas 20% de taxa sobre as gorjetas recebidas.",
  },
  {
    question: "Qual a diferença entre o plano Free e o PRO?",
    answer: "No plano Free, você recebe gorjetas via PIX até o limite de R$ 10,00. No plano PRO, você recebe gorjetas ilimitadas via PIX, além de destaque na busca, analytics completo e suporte prioritário.",
  },
  {
    question: "Como recebo as gorjetas?",
    answer: "Configure sua chave PIX nas configurações do seu perfil e receba gorjetas diretamente na sua conta bancária, instantaneamente e sem taxas.",
  },
  {
    question: "Preciso de equipamento especial?",
    answer: "Não! Basta ter um celular com internet para acessar o Toca+. Você pode gerar um QR Code para deixar na mesa ou compartilhar seu link com os clientes.",
  },
  {
    question: "Posso cancelar o plano PRO a qualquer momento?",
    answer: "Sim! Você pode cancelar quando quiser. Seu acesso PRO continua até o final do período já pago.",
  },
  {
    question: "Como os clientes me encontram?",
    answer: "Quando você ativa o modo 'Ao Vivo', seu perfil aparece para clientes próximos na busca. Você também pode compartilhar seu QR Code ou link direto.",
  },
  {
    question: "Quanto tempo demora para começar?",
    answer: "Menos de 5 minutos! Crie sua conta, adicione algumas músicas ao repertório e você já está pronto para receber gorjetas e pedidos.",
  },
];

export function LandingFAQ() {
  return (
    <section className="py-16 sm:py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre o Toca+
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-lg transition-shadow"
            >
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
