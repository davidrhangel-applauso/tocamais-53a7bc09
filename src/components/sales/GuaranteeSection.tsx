import { Shield, CreditCard, Headphones, RefreshCw } from "lucide-react";

const guarantees = [
  {
    icon: RefreshCw,
    title: "Cancele Quando Quiser",
    description: "Sem multas, sem burocracia. Você está no controle.",
  },
  {
    icon: CreditCard,
    title: "Pagamento Seguro",
    description: "PIX ou cartão com criptografia de ponta a ponta.",
  },
  {
    icon: Headphones,
    title: "Suporte Prioritário",
    description: "Time dedicado para ajudar artistas PRO.",
  },
  {
    icon: Shield,
    title: "Seus Dados Protegidos",
    description: "Privacidade e segurança em primeiro lugar.",
  },
];

export function GuaranteeSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Garantia e Segurança
          </h2>
          <p className="text-muted-foreground">
            Sua tranquilidade é nossa prioridade
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {guarantees.map((item, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
