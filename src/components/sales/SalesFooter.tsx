import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function SalesFooter() {
  return (
    <footer className="py-8 bg-muted/30 border-t border-border mb-20 md:mb-0">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/termos" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <span>© {new Date().getFullYear()} TocaMais</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
