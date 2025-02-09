
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const PrescriptionDetails = () => {
  const location = useLocation();
  const { detectedText, analysis } = location.state?.prescriptionData || {};

  return (
    <div className="min-h-screen bg-background font-cairo p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">تفاصيل الوصفة الطبية</h1>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button className="mb-6 w-full flex items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              اقرأ الوصفة
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>نتائج تحليل الوصفة الطبية</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">النص المكتشف</h3>
                <p className="text-gray-700">{detectedText || "لم يتم اكتشاف نص"}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">اسم الدواء</h3>
                    <p className="text-gray-700">{analysis?.medication_name || "غير متوفر"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">الجرعة</h3>
                    <p className="text-gray-700">{analysis?.dosage || "غير متوفر"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">عدد مرات الاستخدام</h3>
                    <p className="text-gray-700">{analysis?.frequency || "غير متوفر"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">تعليمات الاستخدام</h3>
                    <p className="text-gray-700">{analysis?.instructions || "غير متوفر"}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">الآثار الجانبية المحتملة</h3>
                  <p className="text-gray-700">{analysis?.side_effects || "غير متوفر"}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">موانع الاستعمال</h3>
                  <p className="text-gray-700">{analysis?.contraindications || "غير متوفر"}</p>
                </div>

                {analysis?.medical_notes && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-2">ملاحظات طبية إضافية</h3>
                    <p className="text-gray-700">{analysis.medical_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>النص المكتشف</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{detectedText || "لم يتم اكتشاف نص"}</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>تحليل الوصفة الطبية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">اسم الدواء</h3>
                  <p className="text-gray-700">{analysis?.medication_name || "غير متوفر"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">الجرعة</h3>
                  <p className="text-gray-700">{analysis?.dosage || "غير متوفر"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">عدد مرات الاستخدام</h3>
                  <p className="text-gray-700">{analysis?.frequency || "غير متوفر"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">تعليمات الاستخدام</h3>
                  <p className="text-gray-700">{analysis?.instructions || "غير متوفر"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-2">الآثار الجانبية المحتملة</h3>
                <p className="text-gray-700">{analysis?.side_effects || "غير متوفر"}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-2">موانع الاستعمال</h3>
                <p className="text-gray-700">{analysis?.contraindications || "غير متوفر"}</p>
              </div>

              {analysis?.medical_notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">ملاحظات طبية إضافية</h3>
                  <p className="text-gray-700">{analysis.medical_notes}</p>
                </div>
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
