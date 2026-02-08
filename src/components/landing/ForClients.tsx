import { Button } from "@/components/ui/button";
import { Search, Music, Heart, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ForClients() {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-6">
            <Search className="w-8 h-8 text-accent" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Quer pedir músicas?
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Encontre artistas tocando perto de você, peça suas músicas favoritas e apoie com gorjetas
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 text-primary" />
              <span>Artistas próximos</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Music className="w-5 h-5 text-primary" />
              <span>Peça músicas</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="w-5 h-5 text-primary" />
              <span>Envie gorjetas</span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/buscar")}
            className="px-8 py-6 text-lg bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
          >
            <Search className="w-5 h-5 mr-2" />
            Buscar Artistas
          </Button>
        </div>
      </div>
    </section>
  );
}
