import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface CoverPhotoUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => void;
}

const ASPECT_RATIO = 16 / 9;

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      },
      "image/jpeg",
      0.9
    );
  });
}

export const CoverPhotoUpload = ({ currentUrl, onUpload }: CoverPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
  }, []);

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) {
      toast.error("Selecione uma área para recortar");
      return;
    }

    try {
      setUploading(true);

      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileName = `${user.id}/cover-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedBlob, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      onUpload(publicUrl);
      setIsDialogOpen(false);
      setImageSrc(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      toast.success("Foto de capa atualizada!");
    } catch (error: any) {
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onUpload("");
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Foto de Capa</label>
      
      {/* Cover Photo Preview */}
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border border-border">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Foto de capa"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mb-2" />
            <span className="text-sm">Nenhuma foto de capa</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => document.getElementById("cover-photo-upload")?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {currentUrl ? "Alterar" : "Upload"}
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
        id="cover-photo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {/* Crop Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recortar Foto de Capa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Arraste para ajustar a área de recorte. A proporção 16:9 é mantida automaticamente.
            </p>

            {imageSrc && (
              <div className="max-h-[60vh] overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={ASPECT_RATIO}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Imagem para recortar"
                    onLoad={onImageLoad}
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDialogClose} disabled={uploading}>
                Cancelar
              </Button>
              <Button onClick={handleCropComplete} disabled={uploading}>
                {uploading ? "Salvando..." : "Salvar Recorte"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
