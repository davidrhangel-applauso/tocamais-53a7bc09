import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, QrCode, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import jsQR from "jsqr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PixQRCodeUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => void;
}

export const PixQRCodeUpload = ({ currentUrl, onUpload }: PixQRCodeUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const fileRef = useRef<File | null>(null);

  const validateQRCode = (imageDataUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        resolve(code?.data || null);
      };
      img.onerror = () => resolve(null);
      img.src = imageDataUrl;
    });
  };

  const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setValidating(true);
    
    const reader = new FileReader();
    reader.addEventListener('load', async () => {
      const dataUrl = reader.result?.toString() || '';
      
      const qrContent = await validateQRCode(dataUrl);
      setValidating(false);
      
      if (!qrContent) {
        toast.error('Imagem inválida: não foi possível detectar um QR Code válido');
        return;
      }
      
      // Check if it looks like a PIX QR code (contains BR.GOV.BCB.PIX or pix.bcb.gov.br)
      const isPixQR = qrContent.includes('BR.GOV.BCB.PIX') || 
                      qrContent.toLowerCase().includes('pix') ||
                      qrContent.startsWith('00020126');
      
      if (!isPixQR) {
        toast.warning('QR Code detectado, mas pode não ser um QR Code PIX válido. Verifique antes de confirmar.');
      }
      
      fileRef.current = file;
      setPreview(dataUrl);
      setQrData(qrContent);
      setShowPreviewDialog(true);
    });
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!fileRef.current) return;

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = fileRef.current.name.split('.').pop();
      const fileName = `${user.id}/pix-qr-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileRef.current, {
          upsert: true,
          contentType: fileRef.current.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onUpload(publicUrl);
      toast.success('QR Code PIX atualizado com sucesso!');
      setShowPreviewDialog(false);
      setPreview('');
      setQrData('');
      fileRef.current = null;
    } catch (error: any) {
      toast.error('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onUpload('');
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">QR Code PIX</label>
      
      {currentUrl ? (
        <div className="flex flex-col items-center gap-3 p-4 border border-border rounded-lg bg-background">
          <img
            src={currentUrl}
            alt="QR Code PIX"
            className="w-40 h-40 object-contain rounded-lg bg-white p-2"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById('pix-qr-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Trocar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4 mr-2" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => !validating && document.getElementById('pix-qr-upload')?.click()}
        >
          {validating ? (
            <>
              <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
              <p className="text-sm font-medium">Validando QR Code...</p>
            </>
          ) : (
            <>
              <QrCode className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Clique para fazer upload</p>
                <p className="text-xs text-muted-foreground">
                  Faça upload da imagem do QR Code gerado pelo seu banco
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || validating}
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar imagem
              </Button>
            </>
          )}
        </div>
      )}

      <input
        id="pix-qr-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onSelectFile}
        disabled={uploading || validating}
      />

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Confirmar QR Code PIX
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {preview && (
              <img
                src={preview}
                alt="Preview QR Code"
                className="max-h-[250px] w-auto rounded-lg bg-white p-2"
              />
            )}
            
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>QR Code válido detectado</span>
            </div>
            
            {qrData && (
              <p className="text-xs text-muted-foreground text-center max-w-full overflow-hidden text-ellipsis">
                Conteúdo: {qrData.substring(0, 50)}{qrData.length > 50 ? '...' : ''}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPreviewDialog(false);
                setPreview('');
                setQrData('');
                fileRef.current = null;
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={uploading}
            >
              {uploading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
