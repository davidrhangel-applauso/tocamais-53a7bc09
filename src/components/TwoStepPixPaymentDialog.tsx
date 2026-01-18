import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, QrCode, Clock, Loader2, ArrowLeft, ArrowRight, CheckCircle2, Music } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePixPayload, generatePixQRCodeDataUrl } from "@/lib/pix-qr-generator";

interface Musica {
  id: string;
  titulo: string;
  artista_original: string | null;
}

interface TwoStepPixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistaId: string;
  artistaNome: string;
  pixChave: string;
  pixTipoChave: string;
  clienteId: string | null;
  sessionId: string;
  musicas?: Musica[];
}

const pixTipoChaveLabels: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  celular: "Celular",
  aleatoria: "Chave Aleatória",
};

export function TwoStepPixPaymentDialog({
  open,
  onOpenChange,
  artistaId,
  artistaNome,
  pixChave,
  pixTipoChave,
  clienteId,
  sessionId,
  musicas = [],
}: TwoStepPixPaymentDialogProps) {
  // Step state: 'pedido' or 'pagamento'
  const [step, setStep] = useState<'pedido' | 'pagamento'>('pedido');
  
  // Step 1: Request form state
  const [clienteNome, setClienteNome] = useState("");
  const [pedidoMusica, setPedidoMusica] = useState("");
  const [pedidoMensagem, setPedidoMensagem] = useState("");
  const [musicaCustomizada, setMusicaCustomizada] = useState(false);
  const [creatingPedido, setCreatingPedido] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  
  // Step 2: Payment state
  const [valorGorjeta, setValorGorjeta] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [dynamicQrCode, setDynamicQrCode] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [confirmingPix, setConfirmingPix] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('pedido');
      setClienteNome("");
      setPedidoMusica("");
      setPedidoMensagem("");
      setMusicaCustomizada(false);
      setPedidoId(null);
      setValorGorjeta("");
      setDynamicQrCode(null);
    }
  }, [open]);

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
    if (rawValue.length <= 10) {
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
    if (step !== 'pagamento') return;
    
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
    
    const timeoutId = setTimeout(generateQr, 500);
    return () => clearTimeout(timeoutId);
  }, [valorGorjeta, pixChave, pixTipoChave, artistaNome, step]);

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

  // Step 1: Create the request and move to step 2
  const handleCriarPedido = async () => {
    if (!clienteNome.trim()) {
      toast.error("Por favor, digite seu nome");
      return;
    }

    setCreatingPedido(true);
    try {
      // IMPORTANT: anonymous users do NOT have a SELECT policy on pedidos by default.
      // Using `.select()` after insert makes PostgREST try to read the inserted row,
      // which can fail with RLS. So we generate the id client-side and insert without returning.
      const newPedidoId = crypto.randomUUID();

      const insertData: any = {
        id: newPedidoId,
        artista_id: artistaId,
        cliente_nome: clienteNome.trim(),
        session_id: sessionId,
        musica: pedidoMusica.trim() || "Gorjeta sem pedido de música",
        mensagem: pedidoMensagem.trim() || null,
        status: "aguardando_pix",
        valor: null,
      };

      // Only include cliente_id if user is authenticated
      if (clienteId) {
        insertData.cliente_id = clienteId;
      }

      const { error } = await supabase.from("pedidos").insert(insertData);
      if (error) throw error;

      setPedidoId(newPedidoId);
      toast.success("Pedido enviado! Agora envie uma gorjeta 🎵");
      setStep('pagamento');
    } catch (error: any) {
      toast.error("Erro ao enviar pedido: " + error.message);
    } finally {
      setCreatingPedido(false);
    }
  };

  // Step 2: Confirm PIX payment was made
  const handleConfirmPixPayment = async () => {
    const valor = parseCurrencyToNumber(valorGorjeta);
    if (!valorGorjeta || valor < 1) {
      toast.error("O valor mínimo do PIX é R$ 1,00");
      return;
    }

    if (!pedidoId) {
      toast.error("Erro: pedido não encontrado");
      return;
    }

    setConfirmingPix(true);
    try {
      // Update pedido with valor and new status
      const { error: pedidoError } = await supabase
        .from("pedidos")
        .update({
          status: "aguardando_confirmacao_pix",
          valor: valor,
        })
        .eq("id", pedidoId);

      if (pedidoError) throw pedidoError;

      toast.success("PIX registrado! O artista irá confirmar o recebimento.");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao confirmar PIX: " + error.message);
    } finally {
      setConfirmingPix(false);
    }
  };

  // Skip payment and just close
  const handleSkipPayment = () => {
    toast.success("Pedido enviado! O artista verá seu pedido.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {step === 'pedido' ? (
          <>
            {/* STEP 1: REQUEST FORM */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Pedir música para {artistaNome}
              </DialogTitle>
              <DialogDescription>
                Etapa 1 de 2: Faça seu pedido musical
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* PRO Badge */}
              <div className="flex justify-center">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0 px-4 py-1">
                  ⭐ 100% vai para o artista
                </Badge>
              </div>

              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="clienteNome">Seu nome *</Label>
                <Input
                  id="clienteNome"
                  placeholder="Ex: João da mesa 5"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                />
              </div>

              {/* Music Selection */}
              {musicas.length > 0 ? (
                !musicaCustomizada ? (
                  <div className="space-y-2">
                    <Label htmlFor="pedidoMusica-select">Escolha uma música (opcional)</Label>
                    <Select value={pedidoMusica} onValueChange={setPedidoMusica}>
                      <SelectTrigger id="pedidoMusica-select">
                        <SelectValue placeholder="Selecione uma música" />
                      </SelectTrigger>
                      <SelectContent>
                        {musicas.map((m) => (
                          <SelectItem key={m.id} value={m.titulo}>
                            <div className="flex flex-col">
                              <span>{m.titulo}</span>
                              {m.artista_original && (
                                <span className="text-xs text-muted-foreground">
                                  {m.artista_original}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="px-0 h-auto"
                      onClick={() => {
                        setMusicaCustomizada(true);
                        setPedidoMusica("");
                      }}
                    >
                      Ou digite outra música
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="pedidoMusica">
                      Música *
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => {
                          setMusicaCustomizada(false);
                          setPedidoMusica("");
                        }}
                      >
                        Ver repertório
                      </Button>
                    </Label>
                    <Input
                      id="pedidoMusica"
                      placeholder="Nome da música ou artista"
                      value={pedidoMusica}
                      onChange={(e) => setPedidoMusica(e.target.value)}
                    />
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="pedidoMusica">Música (opcional)</Label>
                  <Input
                    id="pedidoMusica"
                    placeholder="Nome da música ou artista"
                    value={pedidoMusica}
                    onChange={(e) => setPedidoMusica(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 O artista ainda não cadastrou seu repertório
                  </p>
                </div>
              )}

              {/* Message/Dedication */}
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

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleCriarPedido}
                  disabled={creatingPedido || !clienteNome.trim()}
                  className="w-full"
                >
                  {creatingPedido ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Avançar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={creatingPedido}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* STEP 2: PAYMENT */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Enviar gorjeta via PIX
              </DialogTitle>
              <DialogDescription>
                Etapa 2 de 2: Envie uma gorjeta para {artistaNome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Success message */}
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 dark:text-green-400">Pedido enviado!</p>
                  <p className="text-muted-foreground">
                    {pedidoMusica}
                  </p>
                </div>
              </div>

              {/* PRO Badge */}
              <div className="flex justify-center">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0 px-4 py-1">
                  ⭐ 100% vai para o artista
                </Badge>
              </div>

              {/* Valor Input */}
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

              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => setValorGorjeta(formatCurrency("500"))}>
                  R$ 5
                </Button>
                <Button variant="outline" size="sm" onClick={() => setValorGorjeta(formatCurrency("1000"))}>
                  R$ 10
                </Button>
                <Button variant="outline" size="sm" onClick={() => setValorGorjeta(formatCurrency("2000"))}>
                  R$ 20
                </Button>
              </div>

              {/* Show PIX info only when value is >= 1 */}
              {parseCurrencyToNumber(valorGorjeta) >= 1 && (
                <>
                  {/* Dynamic QR Code */}
                  <div className="flex flex-col items-center gap-3">
                    {generatingQr ? (
                      <div className="w-40 h-40 flex items-center justify-center bg-muted rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : dynamicQrCode ? (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <img
                          src={dynamicQrCode}
                          alt="QR Code PIX"
                          className="w-40 h-40 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center bg-muted rounded-lg text-center p-4">
                        <div className="text-muted-foreground">
                          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                          <p className="text-xs">Gerando QR Code...</p>
                        </div>
                      </div>
                    )}
                    {dynamicQrCode && valorGorjeta && (
                      <p className="text-sm text-green-600 font-medium">
                        ✓ QR Code com R$ {valorGorjeta} incluso
                      </p>
                    )}
                  </div>

                  {/* PIX Copia e Cola */}
                  {pixChave && pixTipoChave && pixCopiaCola && (
                    <div className="space-y-2">
                      <Label className="text-sm">Código PIX Copia e Cola</Label>
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
                    </div>
                  )}

                  {/* PIX Key */}
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
                </>
              )}

              {/* Warning */}
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">Confirmação manual</p>
                  <p className="text-muted-foreground">
                    O artista irá confirmar o recebimento do pagamento.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleConfirmPixPayment}
                  disabled={confirmingPix || !valorGorjeta || parseCurrencyToNumber(valorGorjeta) < 1}
                  className="w-full"
                >
                  {confirmingPix ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    "Já fiz o PIX"
                  )}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('pedido')}
                    disabled={confirmingPix}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSkipPayment}
                    disabled={confirmingPix}
                  >
                    Pular gorjeta
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
