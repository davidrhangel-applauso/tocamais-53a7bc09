import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const testimonials = [
  {
    name: "Carlos Silva",
    style: "MPB/Samba",
    avatar: "",
    quote: "Depois que assinei o PRO, percebi que estava deixando muito dinheiro na mesa. Agora recebo 100% das gorjetas direto no meu PIX!",
    savings: "R$ 280/mês",
  },
  {
    name: "Ana Beatriz",
    style: "Pop/Rock",
    avatar: "",
    quote: "A visibilidade aumentou demais! Apareço em destaque e os clientes me encontram muito mais fácil. Valeu cada centavo.",
    savings: "R$ 350/mês",
  },
  {
    name: "João Pedro",
    style: "Sertanejo",
    avatar: "",
    quote: "O analytics me ajuda a entender quais músicas pedem mais. Consigo planejar melhor meus shows e aumentei meus ganhos em 40%.",
    savings: "R$ 450/mês",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Artistas que já são{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PRO
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Veja o que eles têm a dizer
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-6 relative"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />

              {/* Avatar and Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1">
                    PRO
                  </Badge>
                </div>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.style}</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground mb-4 italic">
                "{testimonial.quote}"
              </p>

              {/* Savings */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 inline-block">
                <span className="text-sm text-muted-foreground">Economia: </span>
                <span className="font-bold text-green-500">{testimonial.savings}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
