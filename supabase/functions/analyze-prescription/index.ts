import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENFDA_API_URL = "https://api.fda.gov/drug/label.json";

async function fetchDrugInfo(name: string) {
  try {
    const params = new URLSearchParams({
      'search': `(generic_name:"${name}" OR brand_name:"${name}")`,
      'limit': '1',
      'sort': 'effective_time:desc'
    });
    
    const response = await fetch(`${OPENFDA_API_URL}?${params}`);
    if (response.status === 200) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const drug = data.results[0];
        return {
          name: drug.openfda?.generic_name?.[0] || name,
          uses: drug.indications_and_usage || ['N/A'],
          warnings: drug.warnings || ['N/A'],
          dosage: drug.dosage_and_administration || ['N/A'],
          interactions: drug.drug_interactions || ['N/A']
        };
      }
    }
    return null;
  } catch (error) {
    console.error("OpenFDA Error:", error);
    return null;
  }
}

serve(async (req) => {
  try {
    const { imageBase64, prescriptionId } = await req.json();
    
    // Your existing image analysis code here...
    // Extract medication names using your current AI model
    const medicationName = "extracted_medication_name"; // Replace with your actual extraction logic
    
    // Fetch drug information from OpenFDA
    const drugInfo = await fetchDrugInfo(medicationName);
    
    // Update the prescription in the database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const { error: updateError } = await supabaseClient
      .from("Patient name")
      .update({
        "Medical prescription": medicationName,
        "drug_info": drugInfo,
        "analysis_complete": true
      })
      .eq('id', prescriptionId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        medication_name: medicationName,
        drug_info: drugInfo
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
