import { Link } from "react-router-dom";
import { Music } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-10 sm:py-12 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Toca+
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/instrucoes" className="hover:text-foreground transition-colors">
              Como funciona
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link to="/buscar" className="hover:text-foreground transition-colors">
              Buscar Artistas
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Toca+. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
