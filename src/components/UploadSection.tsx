import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Camera, FileText } from "lucide-react";

export const UploadSection = () => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log("File uploaded:", file);
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
              />
            </Button>

            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
              onClick={() => document.getElementById("image-input")?.click()}
            >
              <Upload className="h-8 w-8 text-primary" />
              <span>تحميل صورة</span>
              <input
                id="image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </Button>

            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <FileText className="h-8 w-8 text-primary" />
              <span>تحميل ملف</span>
              <input
                id="file-input"
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};