import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Constants, type Database } from "@/integrations/supabase/types";

type MusicStyle = Database["public"]["Enums"]["music_style"];

interface Profile {
  id: string;
  nome: string;
  bio: string | null;
  foto_url: string | null;
  cidade: string | null;
  estilo_musical: MusicStyle | null;
  tipo: "artista" | "cliente";
  instagram: string | null;
  youtube: string | null;
  spotify: string | null;
  link_pix: string | null;
  ativo_ao_vivo: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

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
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
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
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: profile.nome,
          bio: profile.bio,
          foto_url: profile.foto_url,
          cidade: profile.cidade,
          estilo_musical: profile.estilo_musical,
          instagram: profile.instagram,
          youtube: profile.youtube,
          spotify: profile.spotify,
          link_pix: profile.link_pix,
          ativo_ao_vivo: profile.ativo_ao_vivo,
        })
        .eq("id", profile.id);

      if (error) throw error;

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
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.foto_url || ""} />
                <AvatarFallback className="text-2xl">
                  {profile.nome.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                {profile.tipo === "artista" ? "Artista" : "Cliente"}
              </p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={profile.nome}
                  onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foto_url">URL da Foto</Label>
                <Input
                  id="foto_url"
                  value={profile.foto_url || ""}
                  onChange={(e) => setProfile({ ...profile, foto_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={profile.cidade || ""}
                  onChange={(e) => setProfile({ ...profile, cidade: e.target.value })}
                  placeholder="Sua cidade"
                />
              </div>

              {profile.tipo === "artista" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="estilo_musical">Estilo Musical</Label>
                    <Select
                      value={profile.estilo_musical || ""}
                      onValueChange={(value) =>
                        setProfile({ ...profile, estilo_musical: value as MusicStyle })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estilo" />
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
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ""}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Conte sobre você e seu trabalho"
                      rows={4}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Social Links - Only for Artists */}
            {profile.tipo === "artista" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Redes Sociais</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={profile.instagram || ""}
                    onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={profile.youtube || ""}
                    onChange={(e) => setProfile({ ...profile, youtube: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spotify">Spotify</Label>
                  <Input
                    id="spotify"
                    value={profile.spotify || ""}
                    onChange={(e) => setProfile({ ...profile, spotify: e.target.value })}
                    placeholder="https://spotify.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link_pix">Link PIX (para receber gorjetas)</Label>
                  <Input
                    id="link_pix"
                    value={profile.link_pix || ""}
                    onChange={(e) => setProfile({ ...profile, link_pix: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="ativo_ao_vivo">Ao Vivo Agora</Label>
                    <p className="text-sm text-muted-foreground">
                      Indica que você está tocando ao vivo
                    </p>
                  </div>
                  <Switch
                    id="ativo_ao_vivo"
                    checked={profile.ativo_ao_vivo}
                    onCheckedChange={(checked) =>
                      setProfile({ ...profile, ativo_ao_vivo: checked })
                    }
                  />
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
