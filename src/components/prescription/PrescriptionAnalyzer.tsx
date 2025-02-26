import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const analyzePrescription = async (imageData: string) => {
  const toast = useToast();

  try {
    // Validate inputs
    if (!imageData || !prescriptionData.id) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please provide both the image and prescription ID.",
      });
      return;
    }

    // Log the request payload (optional, for debugging)
    const payload = {
      imageBase64: imageData,
      prescriptionId: prescriptionData.id,
    };
    console.log('Request Payload:', JSON.stringify(payload, null, 2));

    // Send the request
    const { data: analysisData, error: analysisError } = await supabase.functions
      .invoke('analyze-prescription', {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

    if (analysisError) {
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: analysisError.message || "Failed to analyze the prescription.",
      });
      throw analysisError;
    }

    // Show success toast
    toast({
      variant: "default",
      title: "Analysis Complete",
      description: "The prescription has been successfully analyzed.",
    });

    console.log('Analysis data:', analysisData);
  } catch (error) {
    // Show error toast
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "An unexpected error occurred.",
    });
    console.error('Error analyzing prescription:', error);
  }
};
