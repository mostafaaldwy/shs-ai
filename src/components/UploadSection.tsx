
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { CameraCapture } from "./CameraCapture";
import { ImageCropper } from "./ImageCropper";
import { ImageConfirmation } from "./ImageConfirmation";
import { UploadOptions } from "./prescription/UploadOptions";
import { AnalysisProgress } from "./prescription/AnalysisProgress";
import { usePrescriptionAnalyzer } from "./prescription/PrescriptionAnalyzer";

export const UploadSection = () => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [croppedImage, setCroppedImage] = useState<string>("");

  const { analyzePrescription } = usePrescriptionAnalyzer({
    setIsAnalyzing,
    setProgress,
    setStatusMessage
  });

  const handleCameraCapture = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsCropperOpen(true);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "نوع الملف غير مدعوم",
          description: "يرجى تحميل صورة فقط",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setCroppedImage(croppedImageUrl);
    setIsConfirmationOpen(true);
  };

  const handleRetry = () => {
    setSelectedImage("");
    setCroppedImage("");
    setIsConfirmationOpen(false);
  };

  const handleConfirm = () => {
    setIsConfirmationOpen(false);
    analyzePrescription(croppedImage);
  };

  return (
    <div id="upload-section" className="w-full max-w-4xl mx-auto p-6 transition-all duration-500">
      <Card className="p-8 bg-white shadow-lg rounded-lg">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-800">تحليل الوصفة الطبية</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              قم بتحميل صورة الوصفة الطبية الخاصة بك وسنساعدك في فهم كيفية استخدام دوائك بسهولة ووضوح
            </p>
          </div>
          
          <AnalysisProgress 
            isAnalyzing={isAnalyzing}
            progress={progress}
            statusMessage={statusMessage}
          />

          <UploadOptions
            onCameraClick={() => setIsCameraOpen(true)}
            onFileSelect={handleFilePick}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </Card>

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <ImageCropper
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageUrl={selectedImage}
        onCropComplete={handleCropComplete}
      />

      <ImageConfirmation
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        imageUrl={croppedImage}
        onConfirm={handleConfirm}
        onRetry={handleRetry}
      />
    </div>
  );
};
