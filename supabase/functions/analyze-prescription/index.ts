import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { GoogleGenerativeAI } from "https://@google/generative-ai";

// Constants
const OPENFDA_API_URL = "https://api.fda.gov/drug/label.json";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY"); // Ensure this is set in your environment
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

// Main server function
serve(async (req: Request) => {
  const allowedOrigins = ["http://localhost:3000"]; // Add your frontend URL
  const allowedMethods = "POST";
  const allowedHeaders = "Content-Type";

  const origin = req.headers.get("Origin"); // Get the Origin header from the request

  // Handle CORS preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    if (origin && allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin || "*", // Echo the origin!
          "Access-Control-Allow-Methods": allowedMethods,
          "Access-Control-Allow-Headers": allowedHeaders,
          "Access-Control-Allow-Credentials": "true", // If needed
          "Access-Control-Max-Age": "86400", // Optional
        },
      });
    } else {
      return new Response("CORS Preflight Error: Origin Not Allowed", { status: 403 });
    }
  }

  try {
    const { imageBase64, prescriptionId } = await req.json();
    if (!imageBase64 || !prescriptionId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log("Received request with prescriptionId:", prescriptionId);

    // Step 1: Analyze prescription image
    const medicationNames = await analyzeImage(imageBase64);
    console.log("Extracted medication names:", medicationNames);

    // Step 2: Fetch drug information for each medication
    const drugInfoPromises = medicationNames.map(fetchDrugInfo);
    const drugInfoResults = (await Promise.all(drugInfoPromises)).filter(Boolean);
    console.log("Fetched drug info:", drugInfoResults);

    // Step 3: Parse the drug information into structured format
    const structuredData = drugInfoResults.map((drug) => ({
      medication_name: drug.name,
      dosage: drug.dosage,
      frequency: drug.frequency,
      instructions: drug.instructions,
      side_effects: drug.side_effects,
    }));
    console.log("Structured data:", structuredData);

    // Step 4: Update the database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { error: updateError } = await supabaseClient
      .from("Patient name")
      .update({
        medications: structuredData, // Store all medications as an array
        analysis_complete: true,
      })
      .eq("id", prescriptionId);

    if (updateError) throw updateError;
    console.log("Database updated successfully");

    // Step 5: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: structuredData,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin || "*", // Echo the origin here as well!
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": allowedHeaders,
          "Access-Control-Allow-Credentials": "true", // If needed
        },
      }
    );

  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
