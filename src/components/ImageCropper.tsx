
import React, { useState } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const ImageCropper = ({ imageUrl, onCropComplete, onClose, isOpen }: ImageCropperProps) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageRef(e.currentTarget);
  };

  const getCroppedImage = () => {
    if (!imageRef || !crop) return;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;
    const pixelRatio = window.devicePixelRatio;
    
    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.drawImage(
      imageRef,
      0,
      0,
      imageRef.naturalWidth,
      imageRef.naturalHeight,
      0,
      0,
      imageRef.naturalWidth,
      imageRef.naturalHeight,
    );
    ctx.restore();

    const base64Image = canvas.toDataURL('image/jpeg');
    onCropComplete(base64Image);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center">تعديل الصورة</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            className="max-h-[60vh] object-contain"
          >
            <img src={imageUrl} onLoad={onImageLoad} alt="للاقتصاص" />
          </ReactCrop>
          <div className="flex gap-4 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
            <Button onClick={getCroppedImage} className="flex-1">
              تم
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
