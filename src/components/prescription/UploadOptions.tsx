
import { Button } from "@/components/ui/button";
import { Camera, FileText, Upload } from "lucide-react";

interface UploadOptionsProps {
  onCameraClick: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzing: boolean;
}

export const UploadOptions = ({ onCameraClick, onFileSelect, isAnalyzing }: UploadOptionsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      <Button
        variant="outline"
        className="h-32 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
        onClick={onCameraClick}
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
          onChange={onFileSelect}
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
          onChange={onFileSelect}
          disabled={isAnalyzing}
        />
      </Button>
    </div>
  );
};
