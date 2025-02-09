
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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

interface Prescription {
  id: number;
  created_at: string;
  "Medical prescription": string | null;
  describe: string | null;
  user_id: string;
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  side_effects?: string;
  contraindications?: string;
  medical_notes?: string;
}

export default function Dashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("Patient name")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPrescriptions(data || []);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل الوصفات الطبية",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        جاري التحميل...
        <Navigation />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">وصفاتي الطبية</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prescriptions.map((prescription) => (
          <Sheet key={prescription.id}>
            <SheetTrigger asChild>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">
                      {new Date(prescription.created_at).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>اقرأ الوصفة</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">الوصفة الطبية</h3>
                    <p className="text-gray-600 line-clamp-3">{prescription["Medical prescription"]}</p>
                  </div>
                </div>
              </Card>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>تفاصيل الوصفة الطبية</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">النص المكتشف</h3>
                  <p className="text-gray-700">{prescription["Medical prescription"] || "لم يتم اكتشاف نص"}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">اسم الدواء</h3>
                      <p className="text-gray-700">{prescription.medication_name || "غير متوفر"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">الجرعة</h3>
                      <p className="text-gray-700">{prescription.dosage || "غير متوفر"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">عدد مرات الاستخدام</h3>
                      <p className="text-gray-700">{prescription.frequency || "غير متوفر"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">تعليمات الاستخدام</h3>
                      <p className="text-gray-700">{prescription.instructions || "غير متوفر"}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-2">الآثار الجانبية المحتملة</h3>
                    <p className="text-gray-700">{prescription.side_effects || "غير متوفر"}</p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-2">موانع الاستعمال</h3>
                    <p className="text-gray-700">{prescription.contraindications || "غير متوفر"}</p>
                  </div>

                  {prescription.medical_notes && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-lg mb-2">ملاحظات طبية إضافية</h3>
                      <p className="text-gray-700">{prescription.medical_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ))}
      </div>

      {prescriptions.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          لا توجد وصفات طبية حتى الآن
        </div>
      )}
      
      <Navigation />
    </div>
  );
};
