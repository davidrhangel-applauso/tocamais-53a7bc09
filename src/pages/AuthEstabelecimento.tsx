import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Check, X, Loader2 } from "lucide-react";
import { ensureProfileForUser } from "@/lib/auth-utils";
import { lovable } from "@/integrations/lovable/index";
import { z } from "zod";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

const emailSchema = z.string()
  .min(1, 'O email é obrigatório')
  .email('Digite um email válido');

const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'A senha deve conter pelo menos um caractere especial');

const tiposEstabelecimento = [
  { value: "bar", label: "Bar" },
  { value: "restaurante", label: "Restaurante" },
  { value: "casa_shows", label: "Casa de Shows" },
  { value: "pub", label: "Pub" },
  { value: "cafe", label: "Café" },
  { value: "hotel", label: "Hotel" },
  { value: "evento", label: "Evento" },
  { value: "outro", label: "Outro" },
];

const AuthEstabelecimento = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState("");

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, tipo')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.tipo === 'estabelecimento') {
            navigate('/painel-local', { replace: true });
            return;
          } else if (profile) {
            // Logged in as another type - sign out first
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const city = formData.get("city") as string;
    const endereco = formData.get("endereco") as string;
    const telefone = formData.get("telefone") as string;

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setEmailError(emailValidation.error.errors[0].message);
      setLoading(false);
      return;
    }

    // Validate password before submission
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setPasswordError(passwordValidation.error.errors[0].message);
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (!tipoEstabelecimento) {
      toast.error("Selecione o tipo de estabelecimento");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: name,
            cidade: city,
            tipo: "estabelecimento",
            endereco: endereco,
            telefone: telefone,
            tipo_estabelecimento: tipoEstabelecimento,
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

        // Update profile with additional fields
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            endereco,
            telefone,
            tipo_estabelecimento: tipoEstabelecimento,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
        
        navigate("/painel-local", { replace: true });
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

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setEmailError(emailValidation.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const loginPassword = formData.get("password") as string;

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setEmailError(emailValidation.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await waitForProfile(data.user.id);
        
        if (!profile) {
          toast.error("Erro ao carregar perfil. Tente novamente.");
          await supabase.auth.signOut();
          return;
        }

        if (profile.tipo !== 'estabelecimento') {
          toast.error("Esta área é exclusiva para estabelecimentos.");
          await supabase.auth.signOut();
          return;
        }

        toast.success("Login realizado com sucesso!");
        navigate("/painel-local");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gradient">Toca+</CardTitle>
          <CardDescription>Área para Estabelecimentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
            🏢 Cadastre seu estabelecimento e receba pedidos musicais dos clientes!
          </div>

          <div className="flex gap-2 mb-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate("/auth")}
            >
              Sou Artista
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate("/buscar")}
            >
              Sou Cliente
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 flex items-center justify-center gap-2 border-border"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast.error("Erro ao entrar com Google");
                console.error("Google OAuth error:", error);
              }
              setLoading(false);
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </Button>

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
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(null);
                      }}
                    />
                    {emailError && (
                      <p className="text-xs text-destructive">{emailError}</p>
                    )}
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
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(null);
                      }}
                    />
                    {emailError && (
                      <p className="text-xs text-destructive">{emailError}</p>
                    )}
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
                  <Label htmlFor="signup-name">Nome do Estabelecimento</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Nome do seu bar/restaurante"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-tipo">Tipo de Estabelecimento</Label>
                  <Select value={tipoEstabelecimento} onValueChange={setTipoEstabelecimento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEstabelecimento.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null);
                    }}
                  />
                  {emailError && (
                    <p className="text-xs text-destructive">{emailError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(null);
                    }}
                  />
                  <PasswordStrengthIndicator password={password} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <Input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError(null);
                    }}
                  />
                  {confirmPassword.length > 0 && (
                    <div className={`flex items-center gap-1 text-xs ${passwordsMatch ? 'text-green-500' : 'text-destructive'}`}>
                      {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{passwordsMatch ? 'As senhas coincidem' : 'As senhas não coincidem'}</span>
                    </div>
                  )}
                  {passwordError && (
                    <p className="text-xs text-destructive">{passwordError}</p>
                  )}
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
                <div className="space-y-2">
                  <Label htmlFor="signup-endereco">Endereço</Label>
                  <Input
                    id="signup-endereco"
                    name="endereco"
                    type="text"
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-telefone">Telefone/WhatsApp</Label>
                  <Input
                    id="signup-telefone"
                    name="telefone"
                    type="tel"
                    placeholder="(00) 00000-0000"
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

export default AuthEstabelecimento;
