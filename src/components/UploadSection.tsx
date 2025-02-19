
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Camera, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { CameraCapture } from "./CameraCapture";
import { ImageCropper } from "./ImageCropper";
import { ImageConfirmation } from "./ImageConfirmation";

export const UploadSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  
  // New state for managing dialogs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [croppedImage, setCroppedImage] = useState<string>("");

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

  const analyzePrescription = async (imageData: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول لاستخدام هذه الخدمة",
      });
      navigate("/auth");
      return;
    }

    setIsAnalyzing(true);
    setProgress(10);
    setStatusMessage("جاري تحميل الصورة...");
    
    try {
      // Save prescription to Supabase first
      setProgress(20);
      setStatusMessage("جاري حفظ الصورة...");
      
      const { data: prescriptionData, error } = await supabase
        .from("Patient name")
        .insert({
          "Medical prescription": "جاري التحليل...",
          describe: "تحليل الوصفة الطبية",
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setProgress(40);
      setStatusMessage("جاري تحليل الوصفة...");

      // Remove the data URL prefix before sending
      const base64Image = imageData.split(',')[1];
      
      // Call edge function to analyze the image
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('analyze-prescription', {
          body: { 
            imageBase64: base64Image,
            prescriptionId: prescriptionData.id
          }
        });

      if (analysisError) throw analysisError;

      setProgress(100);
      setStatusMessage("اكتمل التحليل!");
      
      toast({
        title: "تم تحليل الوصفة الطبية بنجاح",
        description: "تم استخراج المعلومات الطبية",
      });

      navigate("/prescription-details", {
        state: {
          prescriptionId: prescriptionData.id,
          prescriptionData: {
            detectedText: analysisData.medication_name,
            analysis: analysisData
          }
        }
      });
    } catch (error) {
      console.error("Error analyzing prescription:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: error.message || "لم نتمكن من تحليل الوصفة الطبية. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setStatusMessage("");
    }
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
          
          {isAnalyzing && (
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-center text-primary">{statusMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
              onClick={() => setIsCameraOpen(true)}
              disabled={isAnalyzing}
            >
              <Camera className="h-8 w-8 text-primary" />
              <span>التقاط صورة</span>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
              onClick={() => document.getElementById("image-input")?.click()}
              disabled={isAnalyzing}
            >
              <Upload className="h-8 w-8 text-primary" />
              <span>تحميل صورة</span>
              <input
                id="image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFilePick}
                disabled={isAnalyzing}
              />
            </Button>

            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
              onClick={() => document.getElementById("file-input")?.click()}
              disabled={isAnalyzing}
            >
              <FileText className="h-8 w-8 text-primary" />
              <span>تحميل ملف</span>
              <input
                id="file-input"
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleFilePick}
                disabled={isAnalyzing}
              />
            </Button>
          </div>
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
