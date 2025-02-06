import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrescriptionDetails = () => {
  const location = useLocation();
  const prescriptionData = location.state?.prescriptionData || {};

  return (
    <div className="min-h-screen bg-background font-cairo p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">تفاصيل الوصفة الطبية</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>النص المكتشف</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{prescriptionData.detectedText || "لم يتم اكتشاف نص"}</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>معلومات الأدوية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prescriptionData.medications?.map((med: any, index: number) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <h3 className="font-semibold text-xl mb-2">{med.name}</h3>
                  <p className="mb-2"><span className="font-medium">الجرعة:</span> {med.dosage}</p>
                  <p className="mb-2"><span className="font-medium">التعليمات:</span> {med.instructions}</p>
                  <p><span className="font-medium">التحذيرات:</span> {med.warnings}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrescriptionDetails;