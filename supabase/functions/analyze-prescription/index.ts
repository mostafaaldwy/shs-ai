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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Constants
const allowedOrigins = ["http://localhost:8080"]; // Add your frontend URL(s) here
const allowedMethods = "POST, OPTIONS";
const allowedHeaders = "Content-Type";

// Main server function
serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";

  // Handle CORS preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin, // Echo the origin
          "Access-Control-Allow-Methods": allowedMethods,
          "Access-Control-Allow-Headers": allowedHeaders,
        },
      });
    } else {
      return new Response("CORS Preflight Error: Origin Not Allowed", { status: 403 });
    }
  }

  // Handle POST requests
  if (req.method === "POST") {
    try {
      const { imageBase64, prescriptionId } = await req.json();

      // Validate inputs
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

      // Step 3: Parse
  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
