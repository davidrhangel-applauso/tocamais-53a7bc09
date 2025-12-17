import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, QrCode, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePixPayload } from "@/lib/pix-qr-generator";

interface DirectPixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistaId: string;
  artistaNome: string;
  pixChave: string;
  pixTipoChave: string;
  pixQrCodeUrl: string;
  clienteId: string | null;
  sessionId: string;
}

const pixTipoChaveLabels: Record<string, string> = {
  cpf: "CPF",
  email: "E-mail",
  celular: "Celular",
  aleatoria: "Chave Aleatória",
};

export function DirectPixPaymentDialog({
  open,
  onOpenChange,
  artistaId,
  artistaNome,
  pixChave,
  pixTipoChave,
  pixQrCodeUrl,
  clienteId,
  sessionId,
}: DirectPixPaymentDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [clienteNome, setClienteNome] = useState("");
  const [valorGorjeta, setValorGorjeta] = useState("");
  const [pedidoMusica, setPedidoMusica] = useState("");
  const [pedidoMensagem, setPedidoMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  // Format value as Brazilian currency display
  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    const number = parseInt(numericValue, 10) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Parse currency string to number
  const parseCurrencyToNumber = (value: string): number => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return 0;
    return parseInt(numericValue, 10) / 100;
  };

  // Handle currency input change
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length <= 10) { // Limit to prevent overflow
      setValorGorjeta(formatCurrency(rawValue));
    }
  };

  // Generate PIX "Copia e Cola" code from the key (with optional amount)
  const pixCopiaCola = useMemo(() => {
    if (!pixChave || !pixTipoChave) return null;
    try {
      const valor = parseCurrencyToNumber(valorGorjeta);
      return generatePixPayload({
        pixKey: pixChave,
        keyType: pixTipoChave,
        merchantName: artistaNome,
        merchantCity: 'BRASIL',
        amount: valor && valor > 0 ? valor : undefined
      });
    } catch {
      return null;
    }
  }, [pixChave, pixTipoChave, artistaNome, valorGorjeta]);

  const handleCopyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixChave);
      setCopied(true);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar chave PIX");
    }
  };

  const handleCopyPixCode = async () => {
    if (!pixCopiaCola) return;
    try {
      await navigator.clipboard.writeText(pixCopiaCola);
      setCopiedCode(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      toast.error("Erro ao copiar código PIX");
    }
  };

  const handleConfirmPayment = async () => {
    if (!clienteNome.trim()) {
      toast.error("Por favor, digite seu nome");
      return;
    }

    const valor = parseCurrencyToNumber(valorGorjeta);
    if (!valorGorjeta || valor < 1) {
      toast.error("O valor mínimo do PIX é R$ 1,00");
      return;
    }

    setLoading(true);
    try {
      // Create pedido with status aguardando_confirmacao_pix
      const { error } = await supabase.from("pedidos").insert({
        artista_id: artistaId,
        cliente_id: clienteId,
        cliente_nome: clienteNome.trim(),
        session_id: sessionId,
        musica: pedidoMusica.trim() || `Gorjeta R$ ${parseFloat(valorGorjeta).toFixed(2)}`,
        mensagem: pedidoMensagem.trim() || null,
        status: "aguardando_confirmacao_pix",
        valor: parseFloat(valorGorjeta),
      });

      if (error) throw error;

      toast.success("Pedido enviado! O artista irá confirmar o recebimento do PIX.");
      onOpenChange(false);
      
      // Reset form
      setClienteNome("");
      setValorGorjeta("");
      setPedidoMusica("");
      setPedidoMensagem("");
    } catch (error: any) {
      toast.error("Erro ao enviar pedido: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Pagar via PIX para {artistaNome}
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR code ou copie a chave PIX para fazer o pagamento diretamente ao artista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* PRO Badge */}
          <div className="flex justify-center">
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0 px-4 py-1">
              ⭐ 100% vai para o artista
            </Badge>
          </div>

          {/* QR Code */}
          {pixQrCodeUrl && (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <img
                  src={pixQrCodeUrl}
                  alt="QR Code PIX"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground">Escaneie com o app do seu banco</p>
            </div>
          )}

          {/* PIX Key */}
          <div className="space-y-2">
            <Label>Chave PIX ({pixTipoChaveLabels[pixTipoChave] || pixTipoChave})</Label>
            <div className="flex gap-2">
              <Input
                value={pixChave}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyPixKey}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* PIX Copia e Cola */}
          {pixChave && pixTipoChave && (
            <div className="space-y-3">
              <Label>PIX Copia e Cola</Label>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="valorGorjetaCopiaCola" className="text-xs text-muted-foreground whitespace-nowrap">
                    Valor:
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id="valorGorjetaCopiaCola"
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={valorGorjeta}
                      onChange={handleValorChange}
                      className="w-28 h-8 text-sm pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={pixCopiaCola || ""}
                  readOnly
                  className="font-mono text-xs truncate"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPixCode}
                  title="Copiar código completo"
                  disabled={!pixCopiaCola}
                >
                  {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {valorGorjeta && parseCurrencyToNumber(valorGorjeta) > 0 
                  ? `Código com valor R$ ${valorGorjeta} incluso`
                  : "Cole este código no app do seu banco (valor livre)"}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">Confirmação manual</p>
              <p className="text-muted-foreground">
                O artista irá confirmar o recebimento do pagamento. Você será notificado quando ele confirmar.
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm font-medium">Após fazer o PIX, preencha abaixo:</p>
            
            <div className="space-y-2">
              <Label htmlFor="clienteNome">Seu nome *</Label>
              <Input
                id="clienteNome"
                placeholder="Ex: João da mesa 5"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
              />
            </div>

            {/* Valor field removed - synced with PIX Copia e Cola above */}

            <div className="space-y-2">
              <Label htmlFor="pedidoMusica">Pedir música (opcional)</Label>
              <Input
                id="pedidoMusica"
                placeholder="Nome da música ou artista"
                value={pedidoMusica}
                onChange={(e) => setPedidoMusica(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pedidoMensagem">Dedicatória (opcional)</Label>
              <Textarea
                id="pedidoMensagem"
                placeholder="Adicione uma dedicatória especial..."
                value={pedidoMensagem}
                onChange={(e) => setPedidoMensagem(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleConfirmPayment}
              disabled={loading || !clienteNome.trim() || !valorGorjeta}
              className="w-full"
            >
              {loading ? "Enviando..." : "Já fiz o PIX"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
