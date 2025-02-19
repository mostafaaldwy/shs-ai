
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { FileText, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const PrescriptionDetails = () => {
  const location = useLocation();
  const { detectedText, analysis } = location.state?.prescriptionData || {};

  // FDA warning component
  const WarningAlert = ({ title, description }: { title: string; description: string }) => (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );

  // Information section component
  const InfoSection = ({ title, content, className = "" }: { title: string; content: string | undefined; className?: string }) => (
    <div className={cn("space-y-2", className)}>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-gray-700 leading-relaxed">
        {content || "غير متوفر"}
      </p>
    </div>
  );

  const hasWarnings = analysis?.contraindications || analysis?.side_effects;

  return (
    <div className="min-h-screen bg-background font-cairo p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-6 text-center">تفاصيل الوصفة الطبية</h1>
        
        {/* Quick View Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full flex items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              عرض سريع للوصفة
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>ملخص الوصفة الطبية</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <InfoSection title="النص المكتشف" content={detectedText} />
              {analysis && (
                <div className="space-y-4">
                  <InfoSection title="اسم الدواء" content={analysis.medication_name} />
                  <InfoSection title="الجرعة" content={analysis.dosage} />
                  <InfoSection title="التعليمات" content={analysis.instructions} />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>نتيجة تحليل النص</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">{detectedText || "لم يتم اكتشاف نص"}</p>
          </CardContent>
        </Card>

        {/* Medication Details */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الدواء</CardTitle>
          </CardHeader>
          <CardContent>
            {hasWarnings && (
              <div className="mb-6">
                {analysis?.contraindications && (
                  <WarningAlert 
                    title="تنبيه: موانع الاستعمال"
                    description={analysis.contraindications}
                  />
                )}
                {analysis?.side_effects && (
                  <WarningAlert 
                    title="تنبيه: الآثار الجانبية المحتملة"
                    description={analysis.side_effects}
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <InfoSection 
                title="اسم الدواء" 
                content={analysis?.medication_name}
                className="border-b pb-4" 
              />
              
              <InfoSection 
                title="الجرعة المقررة" 
                content={analysis?.dosage}
                className="border-b pb-4" 
              />
              
              <InfoSection 
                title="عدد مرات الاستخدام" 
                content={analysis?.frequency}
                className="border-b pb-4" 
              />
              
              <InfoSection 
                title="تعليمات الاستخدام" 
                content={analysis?.instructions}
                className="border-b pb-4" 
              />

              {analysis?.fdaData && (
                <>
                  <InfoSection 
                    title="معلومات FDA الإضافية" 
                    content={analysis.fdaData.label}
                    className="border-b pb-4" 
                  />
                  
                  <InfoSection 
                    title="تقارير الآثار الجانبية (FDA)" 
                    content={analysis.fdaData.events}
                    className="border-b pb-4" 
                  />
                </>
              )}

              {analysis?.medical_notes && (
                <InfoSection 
                  title="ملاحظات طبية إضافية" 
                  content={analysis.medical_notes} 
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
  );
};

export default PrescriptionDetails;
