
import React, { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const CameraCapture = ({ onCapture, onClose, isOpen }: CameraCaptureProps) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setIsCaptured(true);
    }
  }, [webcamRef]);

  const retake = () => {
    setIsCaptured(false);
    setCapturedImage('');
  };

  const confirmImage = () => {
    onCapture(capturedImage);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center">التقاط صورة الوصفة الطبية</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {!isCaptured ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded-lg"
              />
              <Button onClick={capture} className="w-full">
                <Camera className="ml-2" /> التقاط صورة
              </Button>
            </>
          ) : (
            <>
              <img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
              <div className="flex gap-4 w-full">
                <Button variant="outline" onClick={retake} className="flex-1">
                  <RotateCcw className="ml-2" /> إعادة التقاط
                </Button>
                <Button onClick={confirmImage} className="flex-1">
                  متابعة
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
