
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PrescriptionAnalyzerProps {
  setIsAnalyzing: (value: boolean) => void;
  setProgress: (value: number) => void;
  setStatusMessage: (value: string) => void;
}

export const usePrescriptionAnalyzer = ({ 
  setIsAnalyzing, 
  setProgress, 
  setStatusMessage 
}: PrescriptionAnalyzerProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

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
      setStatusMessage("جاري تحليل الوصفة والبحث عن معلومات الدواء...");
      
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('analyze-prescription', {
          body: { 
            imageBase64: imageData,
            prescriptionId: prescriptionData.id
          }
        });

      if (analysisError) throw analysisError;

      setProgress(100);
      setStatusMessage("اكتمل التحليل!");
      
      toast({
        title: "تم تحليل الوصفة الطبية بنجاح",
        description: "تم استخراج المعلومات الطبية ومعلومات الدواء",
      });

      navigate("/prescription-details", {
        state: {
          prescriptionId: prescriptionData.id,
          prescriptionData: {
            detectedText: analysisData.medication_name,
            analysis: analysisData.drug_info
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

  return { analyzePrescription };
};
