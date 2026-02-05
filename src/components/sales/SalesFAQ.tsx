import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Como funciona o pagamento?",
    answer: "Você pode pagar via PIX ou cartão de crédito. O pagamento é processado de forma segura e seu plano PRO é ativado imediatamente após a confirmação.",
  },
  {
    question: "Quando o PRO é ativado?",
    answer: "Assim que o pagamento for confirmado, seu plano PRO é ativado instantaneamente. No caso de PIX, a ativação leva poucos segundos. Com cartão, a ativação é imediata.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Você pode cancelar sua assinatura quando quiser, sem multas ou taxas adicionais. Basta acessar as configurações da sua conta.",
  },
  {
    question: "E se eu não gostar?",
    answer: "Se você não ficar satisfeito, pode cancelar a qualquer momento. Você continuará tendo acesso ao PRO até o final do período pago.",
  },
  {
    question: "Como funciona o PIX direto?",
    answer: "Com o PRO, você cadastra sua chave PIX pessoal. Quando um cliente faz uma gorjeta, o dinheiro vai direto para sua conta, sem passar pela plataforma. Zero taxas!",
  },
  {
    question: "O destaque na busca realmente funciona?",
    answer: "Sim! Artistas PRO aparecem primeiro nos resultados de busca e têm um selo especial que destaca seu perfil. Isso aumenta significativamente a visibilidade.",
  },
];

export function SalesFAQ() {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <HelpCircle className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Perguntas Frequentes
            </h2>
            <p className="text-muted-foreground">
              Tire suas dúvidas sobre o plano PRO
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
