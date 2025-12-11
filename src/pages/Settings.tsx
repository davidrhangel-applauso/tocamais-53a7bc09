import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Constants, type Database } from "@/integrations/supabase/types";
import { AvatarUpload } from "@/components/AvatarUpload";
import { CoverPhotoUpload } from "@/components/CoverPhotoUpload";
import { MercadoPagoLink } from "@/components/MercadoPagoLink";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentFAQ } from "@/components/PaymentFAQ";

type MusicStyle = Database["public"]["Enums"]["music_style"];

interface Profile {
  id: string;
  nome: string;
  bio: string | null;
  foto_url: string | null;
  foto_capa_url: string | null;
  cidade: string | null;
  estilo_musical: MusicStyle | null;
  tipo: "artista" | "cliente";
  instagram: string | null;
  youtube: string | null;
  spotify: string | null;
  link_pix: string | null;
  ativo_ao_vivo: boolean;
  pix_qr_code_url: string | null;
}

interface PixInfo {
  pix_chave: string | null;
  pix_tipo_chave: string | null;
}

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pixInfo, setPixInfo] = useState<PixInfo>({ pix_chave: null, pix_tipo_chave: null });
  const [hasMercadoPagoLinked, setHasMercadoPagoLinked] = useState(false);
  const { isPro } = useSubscription(profile?.id || null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, bio, foto_url, foto_capa_url, cidade, estilo_musical, tipo, instagram, youtube, spotify, link_pix, ativo_ao_vivo, pix_qr_code_url")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data as Profile);

      // Load PIX info from separate secure table
      if (data.tipo === "artista") {
        const { data: pixData } = await supabase
          .from("artist_pix_info")
          .select("pix_chave, pix_tipo_chave")
          .eq("artist_id", user.id)
          .maybeSingle();
        
        if (pixData) {
          setPixInfo(pixData);
        }

        // Check if artist has MP credentials linked
        const { data: credentials } = await supabase
          .from("artist_mercadopago_credentials")
          .select("seller_id")
          .eq("artist_id", user.id)
          .maybeSingle();
        setHasMercadoPagoLinked(!!credentials?.seller_id);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: profile.nome,
          bio: profile.bio,
          foto_url: profile.foto_url,
          foto_capa_url: profile.foto_capa_url,
          cidade: profile.cidade,
          estilo_musical: profile.estilo_musical,
          instagram: profile.instagram,
          youtube: profile.youtube,
          spotify: profile.spotify,
          link_pix: profile.link_pix,
          ativo_ao_vivo: profile.ativo_ao_vivo,
          pix_qr_code_url: profile.pix_qr_code_url,
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Update PIX info in separate secure table (artists only)
      if (profile.tipo === "artista" && (pixInfo.pix_chave || pixInfo.pix_tipo_chave)) {
        const { error: pixError } = await supabase
          .from("artist_pix_info")
          .upsert({
            artist_id: profile.id,
            pix_chave: pixInfo.pix_chave,
            pix_tipo_chave: pixInfo.pix_tipo_chave,
          }, { onConflict: "artist_id" });

        if (pixError) throw pixError;
      }

      toast.success("Perfil atualizado com sucesso!");
      navigate(profile.tipo === "artista" ? "/painel" : "/home");
    } catch (error: any) {
      toast.error("Erro ao salvar perfil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(profile?.tipo === "artista" ? "/painel" : "/home");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gradient">Configurações</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Editar Perfil</CardTitle>
            <CardDescription>
              Atualize suas informações pessoais e configurações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <AvatarUpload
              currentUrl={profile.foto_url}
              onUpload={(url) => setProfile({ ...profile, foto_url: url })}
              userName={profile.nome}
            />

            {/* Cover Photo Upload - Only for artists */}
            {profile.tipo === "artista" && (
              <CoverPhotoUpload
                currentUrl={profile.foto_capa_url}
                onUpload={(url) => setProfile({ ...profile, foto_capa_url: url })}
              />
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={profile.nome}
                  onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  type="text"
                  placeholder="São Paulo, SP"
                  value={profile.cidade || ""}
                  onChange={(e) => setProfile({ ...profile, cidade: e.target.value })}
                />
              </div>

              {profile.tipo === "artista" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="estilo_musical">Estilo Musical</Label>
                    <Select
                      value={profile.estilo_musical || ""}
                      onValueChange={(value) => setProfile({ ...profile, estilo_musical: value as MusicStyle })}
                    >
                      <SelectTrigger id="estilo_musical">
                        <SelectValue placeholder="Selecione um estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Constants.public.Enums.music_style.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      placeholder="Conte um pouco sobre você e sua música..."
                      value={profile.bio || ""}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={4}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Social Links - Only for artists */}
            {profile.tipo === "artista" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Redes Sociais</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    type="url"
                    placeholder="https://instagram.com/seuuser"
                    value={profile.instagram || ""}
                    onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    type="url"
                    placeholder="https://youtube.com/seu-canal"
                    value={profile.youtube || ""}
                    onChange={(e) => setProfile({ ...profile, youtube: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spotify">Spotify</Label>
                  <Input
                    id="spotify"
                    type="url"
                    placeholder="https://open.spotify.com/artist/..."
                    value={profile.spotify || ""}
                    onChange={(e) => setProfile({ ...profile, spotify: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* PIX Próprio Section - Only for PRO artists */}
            {profile.tipo === "artista" && isPro && (
              <div className="space-y-4 p-4 border border-amber-500/20 rounded-lg bg-amber-500/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    PIX Próprio
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0 text-xs">
                      Exclusivo PRO ⭐
                    </Badge>
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure seu PIX para receber gorjetas diretamente, sem intermediários e instantaneamente.
                  <strong className="block mt-1 text-amber-600 dark:text-amber-400">
                    Quando configurado, clientes só poderão pagar via seu PIX.
                  </strong>
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="pix_tipo_chave">Tipo de Chave PIX</Label>
                  <Select
                    value={pixInfo.pix_tipo_chave || ""}
                    onValueChange={(value) => setPixInfo({ ...pixInfo, pix_tipo_chave: value })}
                  >
                    <SelectTrigger id="pix_tipo_chave">
                      <SelectValue placeholder="Selecione o tipo de chave" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="celular">Celular</SelectItem>
                      <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix_chave">Chave PIX</Label>
                  <Input
                    id="pix_chave"
                    placeholder={
                      pixInfo.pix_tipo_chave === "cpf" ? "000.000.000-00" :
                      pixInfo.pix_tipo_chave === "email" ? "seu@email.com" :
                      pixInfo.pix_tipo_chave === "celular" ? "+55 11 99999-9999" :
                      "Cole sua chave aleatória aqui"
                    }
                    value={pixInfo.pix_chave || ""}
                    onChange={(e) => setPixInfo({ ...pixInfo, pix_chave: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix_qr_code_url">URL do QR Code PIX</Label>
                  <Input
                    id="pix_qr_code_url"
                    type="url"
                    placeholder="https://... (link da imagem do QR code)"
                    value={profile.pix_qr_code_url || ""}
                    onChange={(e) => setProfile({ ...profile, pix_qr_code_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Gere um QR code estático no seu banco e faça upload da imagem. Cole o link aqui.
                  </p>
                </div>

                {pixInfo.pix_chave && profile.pix_qr_code_url && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                      ✅ PIX Próprio configurado! Clientes verão apenas esta opção de pagamento.
                    </p>
                  </div>
                )}

                {(!pixInfo.pix_chave || !profile.pix_qr_code_url) && (
                  <div className="p-3 bg-muted/50 border border-border/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      💡 Preencha a chave PIX e o QR code para ativar o pagamento direto.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Subscription Plan - Only for artists */}
            {profile.tipo === "artista" && (
              <div className="space-y-4">
                <SubscriptionCard 
                  artistaId={profile.id} 
                  hasMercadoPagoLinked={hasMercadoPagoLinked}
                />
              </div>
            )}

            {/* Payment Settings - Only for artists */}
            {profile.tipo === "artista" && (
              <div className="space-y-4">
                <MercadoPagoLink userId={profile.id} isPro={isPro} />
              </div>
            )}

            {/* Payment FAQ - Only for artists */}
            {profile.tipo === "artista" && (
              <div className="space-y-4">
                <PaymentFAQ />
              </div>
            )}

            {/* Live Status - Only for artists */}
            {profile.tipo === "artista" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Status</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ativo_ao_vivo">Ao Vivo Agora</Label>
                    <p className="text-sm text-muted-foreground">
                      Ative quando estiver tocando ao vivo
                    </p>
                  </div>
                  <Switch
                    id="ativo_ao_vivo"
                    checked={profile.ativo_ao_vivo}
                    onCheckedChange={(checked) => setProfile({ ...profile, ativo_ao_vivo: checked })}
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
