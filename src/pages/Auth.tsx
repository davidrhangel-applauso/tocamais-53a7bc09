import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Music } from "lucide-react";
import { waitForProfile } from "@/lib/auth-utils";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [userType, setUserType] = useState<"artist" | "client">("client");

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const city = formData.get("city") as string;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: name,
            cidade: city,
            tipo: userType === "artist" ? "artista" : "cliente",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        toast.success("Conta criada com sucesso!");
        
        // Wait for the trigger to create the profile with retry logic
        const profile = await waitForProfile(authData.user.id);
        
        if (!profile) {
          toast.error("Erro ao criar perfil. Por favor, tente fazer login.");
          return;
        }
        
        navigate(profile.tipo === "artista" ? "/painel" : "/home", { replace: true });
      }
    } catch (error: any) {
      if (error.message?.includes("User already registered")) {
        toast.error("Este email já está cadastrado. Tente fazer login.");
      } else {
        toast.error(error.message || "Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await waitForProfile(data.user.id);
        
        if (!profile) {
          toast.error("Erro ao carregar perfil. Tente novamente.");
          await supabase.auth.signOut();
          return;
        }

        toast.success("Login realizado com sucesso!");
        
        if (profile.tipo === "artista") {
          navigate("/painel");
        } else {
          navigate("/home");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Music className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gradient">Toca+</CardTitle>
          <CardDescription>Conecte-se com artistas e música ao vivo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-2">
            <Button
              variant={userType === "client" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setUserType("client")}
            >
              Sou Cliente
            </Button>
            <Button
              variant={userType === "artist" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setUserType("artist")}
            >
              Sou Artista
            </Button>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {isForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">E-mail</Label>
                    <Input
                      id="reset-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Link de Recuperação"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsForgotPassword(false)}
                  >
                    Voltar ao Login
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">E-mail</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setIsForgotPassword(true)}
                  >
                    Esqueci minha senha
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-city">Cidade</Label>
                  <Input
                    id="signup-city"
                    name="city"
                    type="text"
                    placeholder="Sua cidade"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
