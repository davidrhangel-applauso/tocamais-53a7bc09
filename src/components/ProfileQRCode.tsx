import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, QrCode, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ProfileQRCodeProps {
  artistId: string;
  artistName: string;
}

const ProfileQRCode = ({ artistId, artistName }: ProfileQRCodeProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const profileUrl = `${window.location.origin}/artista/${artistId}`;

  useEffect(() => {
    generateQRCode();
  }, [artistId]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const dataUrl = await QRCode.toDataURL(profileUrl, {
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      setQrCodeUrl(dataUrl);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      toast.error("Erro ao gerar QR Code");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `qrcode-${artistName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success("QR Code baixado!");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code do Perfil
        </CardTitle>
        <CardDescription>
          Compartilhe este QR Code para que clientes acessem seu perfil diretamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Gerando QR Code...</p>
          </div>
        ) : qrCodeUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <img 
                src={qrCodeUrl} 
                alt="QR Code do perfil" 
                className="w-[250px] h-[250px]"
              />
            </div>
            
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Escaneie o código para acessar seu perfil público
            </p>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={handleDownload} variant="default" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Baixar QR Code
              </Button>
              <Button onClick={handleCopyLink} variant="outline" size="sm">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link
                  </>
                )}
              </Button>
            </div>

            <div className="w-full p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground break-all text-center">
                {profileUrl}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">Erro ao gerar QR Code</p>
            <Button onClick={generateQRCode} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileQRCode;
