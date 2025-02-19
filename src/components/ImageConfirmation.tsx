
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check } from 'lucide-react';

interface ImageConfirmationProps {
  imageUrl: string;
  onConfirm: () => void;
  onRetry: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export const ImageConfirmation = ({ imageUrl, onConfirm, onRetry, onClose, isOpen }: ImageConfirmationProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center">تأكيد الصورة</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <img src={imageUrl} alt="Preview" className="w-full rounded-lg" />
          <p className="text-center text-gray-600">
            يرجى التأكد من أن الصورة واضحة وأن الوصفة الطبية مرئية بشكل جيد
          </p>
          <div className="flex gap-4 w-full">
            <Button variant="outline" onClick={onRetry} className="flex-1">
              <RotateCcw className="ml-2" /> إعادة المحاولة
            </Button>
            <Button onClick={onConfirm} className="flex-1">
              <Check className="ml-2" /> متابعة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
