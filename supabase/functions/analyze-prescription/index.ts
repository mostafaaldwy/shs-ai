import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

// Constants
const OPENFDA_API_URL = "https://api.fda.gov/drug/label.json";
const GEMINI_API_KEY = "AIzaSyDx_ic-Nvad9kdNbI1Hbw_PwHn05AIaA0I"; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to fetch drug information from OpenFDA
async function fetchDrugInfo(name: string) {
  try {
    const params = new URLSearchParams({
      search: `(generic_name:"${name}" + nd_name:"${name}")`,
      limit: "1",
    });

    const response = await fetch(`${OPENFDA_API_URL}?${params}`);
    if (response.status === 200) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const drug = data.results[0];
        return {
          name: drug.openfda?.generic_name?.[0] || name,
          dosage: drug.dosage_and_administration?.[0] || "N/A",
          frequency: drug.frequency_of_use?.[0] || "N/A",
          instructions: drug.instructions_for_use?.[0] || "N/A",
          side_effects: drug.warnings?.[0] || "N/A",
        };
      }
    }
    return null;
  } catch (error) {
    console.error("OpenFDA Error:", error);
    return null;
  }
}

// Function to analyze the prescription image
async function analyzeImage(imageBase64: string) {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    const prompt = `This is a prescription. Extract drug names or class names. 
      Format: DrugName - DosageForm. Return comma-separated values. Example: Paracetamol. 
      Use full names, no abbreviations. Remove 'drug' word if exists.`;

    const result = await visionModel.generateContent([prompt, imagePart]);
    const text = result.response.text();
    return text.split(",").map(entry => entry.trim()).filter(entry => entry);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to analyze prescription image");
  }
}

// Function to parse the AI's response into structured data
function parsePrescriptionInfo(analysis: string) {
  // Define regex patterns to extract each section
  const dosagePattern = /• الجرعة: (.+)/;
  const frequencyPattern = /• التكرار: (.+)/;
  const instructionsPattern = /• التعليمات: (.+)/;
  const sideEffectsPattern = /• الآثار الجانبية: (.+)/;

  // Extract data using regex
  const dosageMatch = analysis.match(dosagePattern);
  const frequencyMatch = analysis.match(frequencyPattern);
  const instructionsMatch = analysis.match(instructionsPattern);
  const sideEffectsMatch = analysis.match(sideEffectsPattern);

  // Return structured data
  return {
    dosage: dosageMatch ? dosageMatch[1].trim() : "N/A",
    frequency: frequencyMatch ? frequencyMatch[1].trim() : "N/A",
    instructions: instructionsMatch ? instructionsMatch[1].trim() : "N/A",
    side_effects: sideEffectsMatch ? sideEffectsMatch[1].trim() : "N/A",
  };
}

// Main server function
serve(async (req) => {
  try {
    const { imageBase64, prescriptionId } = await req.json();

    // Step 1: Analyze prescription image
    const medicationNames = await analyzeImage(imageBase64);

    // Step 2: Fetch drug information for each medication
    const drugInfoPromises = medicationNames.map(fetchDrugInfo);
    const drugInfoResults = (await Promise.all(drugInfoPromises)).filter(Boolean);

    // Step 3: Parse the drug information into structured format
    const structuredData = drugInfoResults.map((drug) => ({
      medication_name: drug.name,
      dosage: drug.dosage,
      frequency: drug.frequency,
      instructions: drug.instructions,
      side_effects: drug.side_effects,
    }));

    // Step 4: Update the database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { error: updateError } = await supabaseClient
      .from("Patient name")
      .update({
        medication_name: structuredData[0].medication_name, // Assuming single medication for simplicity
        dosage: structuredData[0].dosage,
        frequency: structuredData[0].frequency,
        instructions: structuredData[0].instructions,
        side_effects: structuredData[0].side_effects,
        analysis_complete: true,
      })
      .eq("id", prescriptionId);

    if (updateError) throw updateError;

    // Step 5: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: structuredData,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
