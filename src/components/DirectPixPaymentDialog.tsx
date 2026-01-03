import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, QrCode, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePixPayload, generatePixQRCodeDataUrl } from "@/lib/pix-qr-generator";

interface DirectPixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistaId: string;
  artistaNome: string;
  pixChave: string;
  pixTipoChave: string;
  pixQrCodeUrl?: string;
  clienteId: string | null;
  sessionId: string;
}

const pixTipoChaveLabels: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
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
  const [dynamicQrCode, setDynamicQrCode] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);

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
        amount: valor && valor >= 1 ? valor : undefined
      });
    } catch {
      return null;
    }
  }, [pixChave, pixTipoChave, artistaNome, valorGorjeta]);

  // Generate dynamic QR Code when value changes
  useEffect(() => {
    const generateQr = async () => {
      if (!pixChave || !pixTipoChave) return;
      
      const valor = parseCurrencyToNumber(valorGorjeta);
      if (valor >= 1) {
        setGeneratingQr(true);
        try {
          const qrDataUrl = await generatePixQRCodeDataUrl({
            pixKey: pixChave,
            keyType: pixTipoChave,
            merchantName: artistaNome,
            merchantCity: 'BRASIL',
            amount: valor
          });
          setDynamicQrCode(qrDataUrl);
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
          setDynamicQrCode(null);
        } finally {
          setGeneratingQr(false);
        }
      } else {
        setDynamicQrCode(null);
      }
    };
    
    // Debounce to avoid generating QR Code on every keystroke
    const timeoutId = setTimeout(generateQr, 500);
    return () => clearTimeout(timeoutId);
  }, [valorGorjeta, pixChave, pixTipoChave, artistaNome]);

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

          {/* Valor Input - Prominent at top */}
          <div className="space-y-2">
            <Label htmlFor="valorGorjetaPix" className="text-base font-medium">
              Qual valor da gorjeta?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">R$</span>
              <Input
                id="valorGorjetaPix"
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={valorGorjeta}
                onChange={handleValorChange}
                className="text-2xl font-bold pl-10 h-14 text-center"
              />
            </div>
            {valorGorjeta && parseCurrencyToNumber(valorGorjeta) > 0 && parseCurrencyToNumber(valorGorjeta) < 1 && (
              <p className="text-xs text-destructive">Valor mínimo: R$ 1,00</p>
            )}
          </div>

          {/* Dynamic QR Code */}
          <div className="flex flex-col items-center gap-3">
            {generatingQr ? (
              <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : dynamicQrCode ? (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <img
                  src={dynamicQrCode}
                  alt="QR Code PIX"
                  className="w-48 h-48 object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg text-center p-4">
                <div className="text-muted-foreground">
                  <QrCode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Digite o valor para gerar o QR Code</p>
                </div>
              </div>
            )}
            {dynamicQrCode && valorGorjeta && (
              <p className="text-sm text-green-600 font-medium">
                ✓ QR Code com R$ {valorGorjeta} incluso
              </p>
            )}
            {dynamicQrCode && (
              <p className="text-xs text-muted-foreground">Escaneie com o app do seu banco</p>
            )}
          </div>

          {/* PIX Copia e Cola */}
          {pixChave && pixTipoChave && (
            <div className="space-y-2">
              <Label className="text-sm">Ou copie o código PIX</Label>
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
              {valorGorjeta && parseCurrencyToNumber(valorGorjeta) >= 1 && (
                <p className="text-xs text-green-600">
                  Código com valor R$ {valorGorjeta} incluso
                </p>
              )}
            </div>
          )}

          {/* PIX Key - Collapsible/secondary */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Chave PIX ({pixTipoChaveLabels[pixTipoChave] || pixTipoChave})
            </Label>
            <div className="flex gap-2">
              <Input
                value={pixChave}
                readOnly
                className="font-mono text-xs"
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
