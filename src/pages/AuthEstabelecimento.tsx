import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Check, X } from "lucide-react";
import { waitForProfile } from "@/lib/auth-utils";
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState("");

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

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
