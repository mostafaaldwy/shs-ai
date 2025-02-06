import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Camera, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { pipeline } from "@huggingface/transformers";
import { useNavigate } from "react-router-dom";

// Define the type for the model output
type ImageToTextResult = {
  generated_text: string;
};

export const UploadSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePrescription = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const textDetectionModel = await pipeline(
        "image-to-text",
        "Xenova/vit-gpt2-image-captioning"
      );

      // تحليل الصورة
      const result = await textDetectionModel(imageData);
      
      // تحليل النص وإرسال طلب للحصول على معلومات الدواء
      if (result && Array.isArray(result) && result.length > 0) {
        const output = result[0] as ImageToTextResult;
        const detectedText = output.generated_text;
        
        toast({
          title: "تم تحليل الوصفة الطبية بنجاح",
          description: "جاري معالجة المعلومات...",
        });

        // Mock data for demonstration - in a real app, this would come from Mayo Clinic API
        const mockMedications = [
          {
            name: "دواء تجريبي",
            dosage: "قرص واحد مرتين يومياً",
            instructions: "يؤخذ بعد الطعام",
            warnings: "قد يسبب النعاس"
          }
        ];

        // Navigate to the details page with the prescription data
        navigate("/prescription-details", {
          state: {
            prescriptionData: {
              detectedText,
              medications: mockMedications
            }
          }
        });
      }
    } catch (error) {
      console.error("Error analyzing prescription:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "لم نتمكن من تحليل الوصفة الطبية. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      reader.onload = async (event) => {
        if (event.target?.result) {
          await analyzePrescription(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="p-8 bg-white shadow-lg rounded-lg">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-800">تحليل الوصفة الطبية</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              قم بتحميل صورة الوصفة الطبية الخاصة بك وسنساعدك في فهم كيفية استخدام دوائك بسهولة ووضوح
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
              onClick={() => document.getElementById("camera-input")?.click()}
              disabled={isAnalyzing}
            >
              <Camera className="h-8 w-8 text-primary" />
              <span>التقاط صورة</span>
              <input
                id="camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isAnalyzing}
              />
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
                onChange={handleFileUpload}
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
                onChange={handleFileUpload}
                disabled={isAnalyzing}
              />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};