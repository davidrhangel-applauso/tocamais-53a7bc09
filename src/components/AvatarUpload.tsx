import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Crop } from "lucide-react";
import { toast } from "sonner";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AvatarUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => void;
  userName: string;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export const AvatarUpload = ({ currentUrl, onUpload, userName }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<CropType>();
  const [showCropDialog, setShowCropDialog] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '');
      setShowCropDialog(true);
    });
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (completedCrop.x / 100) * image.width * scaleX,
      y: (completedCrop.y / 100) * image.height * scaleY,
      width: (completedCrop.width / 100) * image.width * scaleX,
      height: (completedCrop.height / 100) * image.height * scaleY,
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }, [completedCrop]);

  const handleCropConfirm = async () => {
    try {
      setUploading(true);
      
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) {
        toast.error('Erro ao processar a imagem');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileName = `${user.id}/${Math.random()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onUpload(publicUrl);
      toast.success('Foto atualizada com sucesso!');
      setShowCropDialog(false);
      setImgSrc('');
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
    <div className="flex flex-col items-center gap-4">
      <Avatar className="w-32 h-32">
        <AvatarImage src={currentUrl || undefined} alt={userName} />
        <AvatarFallback className="text-2xl">
          {userName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => document.getElementById('avatar-upload')?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Enviando...' : 'Upload'}
        </Button>

        {currentUrl && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="w-4 h-4 mr-2" />
            Remover
          </Button>
        )}
      </div>

      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onSelectFile}
        disabled={uploading}
      />

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Ajustar foto de perfil
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
                aspect={1}
                circularCrop
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Imagem para recorte"
                  onLoad={onImageLoad}
                  className="max-h-[400px] w-auto"
                />
              </ReactCrop>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCropDialog(false);
                setImgSrc('');
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCropConfirm}
              disabled={uploading || !completedCrop}
            >
              {uploading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
