import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "Como funcionam as taxas da plataforma?",
    answer: `A plataforma cobra uma taxa sobre cada gorjeta recebida:

• **Artistas Free:** Taxa de 20% (você recebe 80% da gorjeta)
• **Artistas Pro (a partir de R$19,90/mês):** Taxa de 0% (você recebe 100% da gorjeta)

Os pagamentos são processados de forma segura via gateway de pagamento.`
  },
  {
    question: "Como recebo os pagamentos das gorjetas?",
    answer: `Os pagamentos são processados de forma segura pela plataforma:

1. **Plano Free:** Os clientes pagam via cartão de crédito/débito. Você recebe 80% do valor.
2. **Plano Pro:** Configure seu PIX próprio e receba 100% instantaneamente, ou receba via plataforma com 0% de taxa.

Os valores são creditados e podem ser transferidos para sua conta.`
  },
  {
    question: "Quais métodos de pagamento os fãs podem usar?",
    answer: `Os fãs podem pagar gorjetas usando:

• **Cartão de Crédito/Débito:** Pagamento seguro via gateway de pagamento
• **PIX Direto (artistas Pro):** Pagamento instantâneo direto para o artista

Todos os métodos são processados com total segurança e criptografia.`
  },
  {
    question: "Vale a pena assinar o plano Pro?",
    answer: `O plano Pro (a partir de R$19,90/mês) vale a pena se você recebe gorjetas regularmente:

**Cálculo de exemplo:**
• **Free:** R$200 em gorjetas = R$160 líquido (20% taxa)
• **Pro:** R$200 em gorjetas = R$200 líquido - R$19,90 = R$180,10 líquido

A partir de ~R$100/mês em gorjetas, o Pro já começa a compensar!`
  },
  {
    question: "Preciso emitir nota fiscal das gorjetas?",
    answer: `Depende do seu regime tributário:

• **Pessoa Física:** Gorjetas são consideradas renda e devem ser declaradas no Imposto de Renda
• **MEI/Empresa:** Pode ser necessário emitir nota fiscal dependendo do valor e frequência

Recomendamos consultar um contador para orientação específica sobre sua situação fiscal.`
  },
  {
    question: "O que acontece se um cliente pedir reembolso?",
    answer: `Disputas de pagamento são tratadas pela plataforma de pagamentos:

• O gateway analisa cada caso e pode contestar chargebacks indevidos
• Se o chargeback for aprovado, o valor é debitado
• Mantenha um bom relacionamento com seu público para evitar disputas`
  }
];

export function PaymentFAQ() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Perguntas Frequentes sobre Pagamentos
        </CardTitle>
        <CardDescription>
          Entenda como funcionam as gorjetas, taxas e prazos de recebimento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground whitespace-pre-line">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
