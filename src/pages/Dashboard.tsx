
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface Prescription {
  id: number;
  created_at: string;
  Medical_prescription: string | null;
  describe: string | null;
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
    return <div className="flex justify-center items-center min-h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">وصفاتي الطبية</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prescriptions.map((prescription) => (
          <Card key={prescription.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">
                  {new Date(prescription.created_at).toLocaleDateString("ar-SA")}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">الوصفة الطبية</h3>
                <p className="text-gray-600 line-clamp-3">{prescription.Medical_prescription}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">التقرير</h3>
                <p className="text-gray-600 line-clamp-3">{prescription.describe}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {prescriptions.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          لا توجد وصفات طبية حتى الآن
        </div>
      )}
    </div>
  );
}
