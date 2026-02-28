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

As gorjetas são enviadas diretamente via PIX para sua conta.`
  },
  {
    question: "Como recebo os pagamentos das gorjetas?",
    answer: `As gorjetas são enviadas diretamente para sua chave PIX cadastrada:

1. **Cadastre sua chave PIX:** Configure sua chave PIX nas configurações do perfil
2. **Receba gorjetas:** Quando um fã fizer uma gorjeta, ele escaneia seu QR Code PIX
3. **Receba instantaneamente:** O dinheiro vai direto para sua conta bancária

Não há intermediários — o pagamento é feito diretamente entre o fã e você.`
  },
  {
    question: "Quais métodos de pagamento os fãs podem usar?",
    answer: `Os fãs podem pagar gorjetas usando:

• **Pix:** Pagamento instantâneo via QR Code diretamente para sua conta

O pagamento é feito diretamente entre o fã e o artista, sem intermediários.`
  },
  {
    question: "Como funciona a assinatura Pro?",
    answer: `A assinatura Pro é paga via cartão de crédito com renovação automática:

• **Mensal:** R$ 19,90/mês
• **Anual:** R$ 99,00/ano (R$ 8,25/mês)
• **Bienal:** R$ 169,90/2 anos (R$ 7,08/mês)

O pagamento é processado de forma segura via Stripe. Você pode cancelar ou trocar de plano a qualquer momento pelo portal de gerenciamento.`
  },
  {
    question: "Vale a pena assinar o plano Pro?",
    answer: `O plano Pro vale a pena se você recebe mais de R$100/mês em gorjetas:

**Cálculo de exemplo (plano mensal):**
• **Free:** R$100 em gorjetas = R$80 líquido (20% taxa)
• **Pro:** R$100 em gorjetas = R$100 líquido - R$19,90 = R$80,10 líquido

A partir de R$100/mês em gorjetas, o Pro começa a compensar. Quanto mais você recebe, maior a economia! Com o plano anual, o ponto de equilíbrio é ainda menor.`
  },
  {
    question: "Preciso emitir nota fiscal das gorjetas?",
    answer: `Depende do seu regime tributário:

• **Pessoa Física:** Gorjetas são consideradas renda e devem ser declaradas no Imposto de Renda
• **MEI/Empresa:** Pode ser necessário emitir nota fiscal dependendo do valor e frequência

Recomendamos consultar um contador para orientação específica sobre sua situação fiscal.`
  },
  {
    question: "Posso cancelar minha assinatura Pro a qualquer momento?",
    answer: `Sim! Você pode cancelar sua assinatura quando quiser:

• Acesse "Gerenciar Assinatura" no seu painel
• O acesso Pro continua até o final do período pago
• Sem multas ou taxas de cancelamento
• Você pode reativar a qualquer momento`
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
          Entenda como funcionam as gorjetas, taxas e assinatura Pro
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
