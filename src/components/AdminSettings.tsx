import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

const SETTING_KEYS = [
  "subscription_pix_key",
  "subscription_pix_key_type",
  "subscription_pix_name",
  "subscription_pix_city",
  "subscription_price_mensal",
  "subscription_price_anual",
  "subscription_price_bienal",
] as const;

type SettingsMap = Record<string, string>;

export function AdminSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const initialPricesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [...SETTING_KEYS]);

      if (error) throw error;

      const map: SettingsMap = {};
      data?.forEach((item) => {
        map[item.setting_key] = item.setting_value;
      });
      // Store initial prices for change detection
      const prices: Record<string, string> = {};
      ["subscription_price_mensal", "subscription_price_anual", "subscription_price_bienal"].forEach((key) => {
        if (map[key]) prices[key] = map[key];
      });
      initialPricesRef.current = prices;
      setSettings(map);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key of SETTING_KEYS) {
        const value = settings[key];
        if (value === undefined || value === "") continue;

        const { error } = await supabase
          .from("admin_settings")
          .upsert(
            { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
            { onConflict: "setting_key" }
          );

        if (error) throw error;
      }
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Chave PIX para Assinaturas</CardTitle>
          <CardDescription>
            Configure os dados PIX que serão usados para gerar o QR Code de pagamento das assinaturas PRO.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pix_key_type">Tipo da Chave</Label>
            <Select
              value={settings.subscription_pix_key_type || ""}
              onValueChange={(v) => handleChange("subscription_pix_key_type", v)}
            >
              <SelectTrigger id="pix_key_type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="telefone">Telefone</SelectItem>
                <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX</Label>
            <Input
              id="pix_key"
              placeholder="Ex: 12345678900 ou email@example.com"
              value={settings.subscription_pix_key || ""}
              onChange={(e) => handleChange("subscription_pix_key", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_name">Nome do Recebedor</Label>
            <Input
              id="pix_name"
              placeholder="Nome conforme cadastro no banco"
              value={settings.subscription_pix_name || ""}
              onChange={(e) => handleChange("subscription_pix_name", e.target.value.slice(0, 25))}
              maxLength={25}
            />
            <p className="text-xs text-muted-foreground">
              Máximo 25 caracteres (padrão PIX)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_city">Cidade</Label>
            <Input
              id="pix_city"
              placeholder="Ex: SAO PAULO"
              value={settings.subscription_pix_city || ""}
              onChange={(e) => handleChange("subscription_pix_city", e.target.value.slice(0, 15).toUpperCase())}
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">
              Máximo 15 caracteres, em maiúsculas (padrão PIX)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valores dos Planos</CardTitle>
          <CardDescription>
            Defina o valor de cada plano PRO. Esses valores serão usados no checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_mensal">Mensal (R$)</Label>
              <Input
                id="price_mensal"
                type="number"
                step="0.01"
                min="0"
                placeholder="39.90"
                value={settings.subscription_price_mensal || ""}
                onChange={(e) => handleChange("subscription_price_mensal", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_anual">Anual (R$)</Label>
              <Input
                id="price_anual"
                type="number"
                step="0.01"
                min="0"
                placeholder="359.90"
                value={settings.subscription_price_anual || ""}
                onChange={(e) => handleChange("subscription_price_anual", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_bienal">Bienal (R$)</Label>
              <Input
                id="price_bienal"
                type="number"
                step="0.01"
                min="0"
                placeholder="599.90"
                value={settings.subscription_price_bienal || ""}
                onChange={(e) => handleChange("subscription_price_bienal", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar Configurações
      </Button>
    </div>
  );
}
