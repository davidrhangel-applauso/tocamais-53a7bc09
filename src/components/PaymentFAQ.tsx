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
• **Artistas Pro (R$39,90/mês):** Taxa de 0% (você recebe 100% da gorjeta)

Além disso, o Mercado Pago cobra uma pequena taxa de processamento (~1%) que é descontada automaticamente do seu recebimento.`
  },
  {
    question: "Por que o Mercado Pago retém meus pagamentos por 14 dias?",
    answer: `O Mercado Pago retém pagamentos por até 14 dias como medida de segurança contra fraudes e chargebacks. Esse prazo pode variar de acordo com:

• **Verificação da conta:** Contas verificadas têm prazos menores
• **Histórico de vendas:** Vendedores com bom histórico recebem mais rápido
• **Tipo de conta:** Contas empresariais podem ter condições diferentes

Você pode configurar a liberação imediata no app do Mercado Pago em: Seu negócio → Configurações → Liberação de dinheiro.`
  },
  {
    question: "Como recebo os pagamentos das gorjetas?",
    answer: `Os pagamentos são processados pelo Mercado Pago e vão diretamente para sua conta vinculada:

1. **Vincule sua conta:** Conecte sua conta Mercado Pago nas configurações
2. **Receba gorjetas:** Quando um fã fizer uma gorjeta, o valor vai para o Mercado Pago
3. **Saque:** O dinheiro fica disponível na sua conta Mercado Pago para saque

Se você não vincular sua conta, os pagamentos ficam retidos na plataforma e precisam ser transferidos manualmente.`
  },
  {
    question: "Quais métodos de pagamento os fãs podem usar?",
    answer: `Os fãs podem pagar gorjetas usando:

• **Pix:** Pagamento instantâneo via QR Code ou código copia e cola
• **Cartão de Crédito:** Pagamento parcelado em até 12x (dependendo do valor)

Ambos os métodos são processados pelo Mercado Pago com total segurança.`
  },
  {
    question: "Vale a pena assinar o plano Pro?",
    answer: `O plano Pro (R$39,90/mês) vale a pena se você recebe mais de R$200/mês em gorjetas:

**Cálculo de exemplo:**
• **Free:** R$200 em gorjetas = R$160 líquido (20% taxa)
• **Pro:** R$200 em gorjetas = R$200 líquido - R$39,90 = R$160,10 líquido

A partir de R$200/mês em gorjetas, o Pro começa a compensar. Quanto mais você recebe, maior a economia!`
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
    answer: `Chargebacks (pedidos de reembolso) são tratados pelo Mercado Pago:

• O Mercado Pago analisa cada caso e pode contestar chargebacks indevidos
• Se o chargeback for aprovado, o valor é debitado da sua conta
• Por isso o Mercado Pago retém pagamentos inicialmente - para cobrir possíveis chargebacks

Mantenha um bom relacionamento com seu público para evitar disputas.`
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
