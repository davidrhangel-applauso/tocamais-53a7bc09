import { Music, Instagram, Youtube, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LandingFooter = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produto: [
      { label: "Para Artistas", href: "/auth" },
      { label: "Para Clientes", href: "/buscar" },
      { label: "Para Estabelecimentos", href: "/auth-estabelecimento" },
      { label: "Preços", href: "/auth" },
    ],
    suporte: [
      { label: "Como Funciona", href: "/instrucoes" },
      { label: "FAQ", href: "#faq" },
      { label: "Contato", href: "mailto:contato@tocamais.com" },
    ],
  };

  return (
    <footer className="relative border-t border-border/40 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl">
                <Music className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Toca+
              </span>
            </div>
            <p className="text-muted-foreground max-w-sm mb-6">
              Conectando artistas e público através da música. Peça suas músicas
              favoritas e apoie artistas independentes.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-card border border-border rounded-lg hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-card border border-border rounded-lg hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="mailto:contato@tocamais.com"
                className="p-2 bg-card border border-border rounded-lg hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-3">
              {footerLinks.produto.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-3">
              {footerLinks.suporte.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("mailto:") ? (
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  ) : link.href.startsWith("#") ? (
                    <button
                      onClick={() =>
                        document
                          .getElementById(link.href.slice(1))
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(link.href)}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/40">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Toca+. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button className="hover:text-primary transition-colors">
                Termos de Uso
              </button>
              <button className="hover:text-primary transition-colors">
                Privacidade
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
