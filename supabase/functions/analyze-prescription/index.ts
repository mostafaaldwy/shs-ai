import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const OPENFDA_API_URL = "https://api.fda.gov/drug/label.json";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const CLASS_TO_GENERIC: { [key: string]: string[] } = {
  "Antibiotic": ["Amoxicillin", "Ciprofloxacin"],
  "Antihistamine": ["Cetirizine", "Loratadine"],
};

async function analyzeImage(imageBase64: string) {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    const prompt = `This is a prescription. Extract drug names or class names with dosage forms. 
      Format: DrugName - DosageForm. Return comma-separated values. Example: Paracetamol - Tablet. 
      Use full names, no abbreviations. Remove 'drug' word if exists.`;

    const result = await visionModel.generateContent([prompt, imagePart]);
    const text = result.response.text();
    return text.split(",").map(entry => entry.trim()).filter(entry => entry);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to analyze prescription image");
  }
}

async function generateAnalysis(drugInfo: any[], age: number, gender: string) {
  try {
    const prompt = `Analyze this drug information for a ${age}-year-old ${gender} in Arabic:
      ${JSON.stringify(drugInfo)}
      
      Provide brief bullet points in Arabic using this format:
      • الجرعة: [dosage]
      • التحذيرات العمرية: [age warnings]
      • احتياطات الجنس: [gender precautions]
      • الآثار الجانبية: [side effects]
      • التفاعلات الدوائية: [interactions]`;

    const result = await visionModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Analysis Generation Error:", error);
    throw new Error("Failed to generate patient analysis");
  }
}

async function fetchDrugInfo(name: string) {
  try {
    const params = new URLSearchParams({
      search: `(generic_name:"${name}" OR brand_name:"${name}")`,
      limit: "1",
      sort: "effective_time:desc"
    });
    
    const response = await fetch(`${OPENFDA_API_URL}?${params}`);
    if (response.status === 200) {
      const data = await response.json();
      if (data.results?.length > 0) {
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
    const { imageBase64, prescriptionId, age, gender } = await req.json();
    
    // Analyze prescription image
    const drugEntries = await analyzeImage(imageBase64);
    const resolvedNames: string[] = [];
    
    // Process drug entries
    for (const entry of drugEntries) {
      if (entry.includes(" - ")) {
        const [name, dosage] = entry.split(" - ");
        resolvedNames.push(...CLASS_TO_GENERIC[name] || [name]);
      } else {
        resolvedNames.push(entry);
      }
    }

    // Fetch drug information
    const drugInfoPromises = resolvedNames.map(fetchDrugInfo);
    const drugInfoResults = (await Promise.all(drugInfoPromises)).filter(Boolean);

    // Generate patient analysis
    const analysis = await generateAnalysis(drugInfoResults, age, gender);

    // Update database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { error } = await supabase
      .from("prescriptions")
      .update({
        medications: resolvedNames,
        drug_info: drugInfoResults,
        analysis: analysis,
        status: "completed"
      })
      .eq("id", prescriptionId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        medications: resolvedNames,
        analysis: analysis,
        drug_info: drugInfoResults 
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Server Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
