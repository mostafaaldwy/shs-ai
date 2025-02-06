import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Camera, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { pipeline } from "@huggingface/transformers";

export const UploadSection = () => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePrescription = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      // إنشاء نموذج للتعرف على النص
      const textDetectionModel = await pipeline(
        "image-to-text",
        "microsoft/trocr-base-handwritten"
      );

      // تحليل الصورة
      const result = await textDetectionModel(imageData);
      
      // تحليل النص وإرسال طلب للحصول على معلومات الدواء
      if (result && result[0]?.text) {
        toast({
          title: "تم تحليل الوصفة الطبية بنجاح",
          description: "جاري البحث عن معلومات الدواء...",
        });
        
        // هنا يمكن إضافة المنطق لاسترجاع معلومات الدواء من Mayo Clinic
        // عن طريق API أو web scraping
      }
    } catch (error) {
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