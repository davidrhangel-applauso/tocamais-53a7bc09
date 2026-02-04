import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Testimonial {
  id: number;
  name: string;
  type: "Artista" | "Cliente" | "Estabelecimento";
  city: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "João Silva",
    type: "Artista",
    city: "São Paulo, SP",
    text: "O Toca+ triplicou minhas gorjetas! Antes eu dependia de caixinha física, agora recebo via PIX durante todo o show. Revolucionou minha forma de tocar.",
    rating: 5,
  },
  {
    id: 2,
    name: "Maria Santos",
    type: "Cliente",
    city: "Rio de Janeiro, RJ",
    text: "Adoro poder pedir minhas músicas favoritas e ainda apoiar o artista diretamente. A experiência de um show ficou muito mais interativa e especial!",
    rating: 5,
  },
  {
    id: 3,
    name: "Bar do Zé",
    type: "Estabelecimento",
    city: "Belo Horizonte, MG",
    text: "Nossos clientes adoram poder interagir com os músicos. O movimento aumentou desde que começamos a usar o Toca+. Recomendo para qualquer bar!",
    rating: 5,
  },
  {
    id: 4,
    name: "Ana Costa",
    type: "Artista",
    city: "Curitiba, PR",
    text: "O app é super intuitivo e o dinheiro cai na hora. Não preciso mais ficar preocupada com troco ou perder gorjetas. Simplesmente funciona!",
    rating: 5,
  },
  {
    id: 5,
    name: "Pedro Lima",
    type: "Cliente",
    city: "Salvador, BA",
    text: "Nunca mais vou a um show sem o Toca+! Pedir música e mandar uma gorjeta ficou tão fácil que virou rotina. Os artistas merecem esse apoio.",
    rating: 5,
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-3">
    <div className="h-full p-6 bg-card border border-border rounded-2xl hover:shadow-xl transition-shadow duration-300">
      <Quote className="w-8 h-8 text-primary/30 mb-4" />
      
      <p className="text-muted-foreground mb-6 line-clamp-4 min-h-[96px]">
        "{testimonial.text}"
      </p>

      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-accent text-accent" />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm">
            {testimonial.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">
            {testimonial.type} • {testimonial.city}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const TestimonialsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="py-16 sm:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            O Que Dizem Sobre Nós
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Histórias reais de quem já usa o Toca+
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-3">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={scrollNext}
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
