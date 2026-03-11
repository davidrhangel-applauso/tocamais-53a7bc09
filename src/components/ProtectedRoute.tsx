import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { waitForProfile } from "@/lib/auth-utils";
import { Music } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTypes?: Array<"artista" | "cliente" | "estabelecimento">;
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, allowedTypes, redirectTo = "/auth" }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(redirectTo, { replace: true });
        return;
      }

      if (allowedTypes) {
        const profile = await waitForProfile(user.id, 5, 500);
        if (!profile) {
          navigate(redirectTo, { replace: true });
          return;
        }
        if (!allowedTypes.includes(profile.tipo)) {
          // Redirect based on type
          if (profile.tipo === "artista") navigate("/painel", { replace: true });
          else if (profile.tipo === "estabelecimento") navigate("/painel-local", { replace: true });
          else navigate("/home", { replace: true });
          return;
        }
      }

      setAuthorized(true);
      setLoading(false);
    };
    check();
  }, []);

  if (loading && !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <Music className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};
