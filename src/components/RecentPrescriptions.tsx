
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

interface Prescription {
  id: number;
  created_at: string;
  medication_name: string;
  Medical_prescription: string | null;
}

export const RecentPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecentPrescriptions = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          return;
        }

        const { data, error } = await supabase
          .from("Patient name")
          .select("id, created_at, medication_name, Medical_prescription")
          .order("created_at", { ascending: false })
          .limit(3);

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

    fetchRecentPrescriptions();
  }, [toast]);

  if (loading) {
    return null;
  }

  if (prescriptions.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4 text-center">آخر الوصفات الطبية</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prescriptions.map((prescription) => (
          <Card
            key={prescription.id}
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/prescription-details`, { 
              state: { prescriptionId: prescription.id } 
            })}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">
                  {new Date(prescription.created_at).toLocaleDateString("ar-SA")}
                </span>
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{prescription.medication_name || "وصفة طبية"}</h3>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
