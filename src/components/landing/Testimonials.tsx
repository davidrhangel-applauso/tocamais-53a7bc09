import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Cantor de MPB",
    location: "São Paulo, SP",
    avatar: "CS",
    quote: "Desde que comecei a usar o Toca+, minhas gorjetas aumentaram 40%. O PIX direto é incrível!",
    rating: 5,
  },
  {
    name: "Ana Beatriz",
    role: "Voz e Violão",
    location: "Rio de Janeiro, RJ",
    avatar: "AB",
    quote: "Finalmente uma plataforma que entende o artista. O QR Code facilitou muito os pedidos de música.",
    rating: 5,
  },
  {
    name: "João Pedro",
    role: "Banda de Rock",
    location: "Belo Horizonte, MG",
    avatar: "JP",
    quote: "Com o plano PRO, recebo 100% das gorjetas. Em um mês já recuperei o valor da assinatura!",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 sm:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            O que os artistas{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              estão dizendo
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Histórias reais de quem já usa o Toca+
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-6 relative hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
            >
              {/* Quote icon */}
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Quote className="w-5 h-5 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} • {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
