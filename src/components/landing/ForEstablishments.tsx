import { Button } from "@/components/ui/button";
import { Building2, Users, Calendar, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ForEstablishments() {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Tem um bar ou restaurante?
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cadastre seu estabelecimento e conecte-se com artistas para eventos ao vivo
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5 text-primary" />
              <span>Atraia mais clientes</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Organize eventos</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Conecte-se com artistas</span>
            </div>
          </div>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/auth-estabelecimento")}
            className="px-8 py-6 text-lg border-2 border-primary/50 hover:border-primary hover:bg-primary/10"
          >
            <Building2 className="w-5 h-5 mr-2" />
            Cadastrar Estabelecimento
          </Button>
        </div>
      </div>
    </section>
  );
}
