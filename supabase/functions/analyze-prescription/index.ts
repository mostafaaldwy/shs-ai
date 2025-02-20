
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PrescriptionAnalysisRequest {
  imageBase64: string;
  prescriptionId: number;
}

interface OpenFDAResponse {
  results: Array<{
    indications_and_usage: string[];
    dosage_and_administration: string[];
    warnings: string[];
    adverse_reactions: string[];
    contraindications: string[];
    description: string[];
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageBase64, prescriptionId } = await req.json() as PrescriptionAnalysisRequest;

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize HuggingFace for OCR
    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));

    console.log('Starting prescription analysis...');

    // Step 1: Extract text from image using Hugging Face OCR
    console.log('Performing OCR...');
    const extractedText = await performOCR(hf, imageBase64);

    // Step 2: Extract medication information using Gemini AI
    console.log('Analyzing text with Gemini AI...');
    const medicationInfo = await analyzeMedicationInfo(extractedText);

    // Step 3: Get FDA data
    console.log('Fetching FDA data...');
    let fdaData = null;
    if (medicationInfo.medication_name) {
      fdaData = await fetchFDAData(medicationInfo.medication_name);
    }

    // Step 4: Update prescription in database
    console.log('Updating prescription record...');
    const { error: updateError } = await supabaseClient
      .from('prescriptions')
      .update({
        extracted_text: extractedText,
        medication_name: medicationInfo.medication_name,
        dosage: medicationInfo.dosage,
        frequency: medicationInfo.frequency,
        instructions: medicationInfo.instructions,
        side_effects: fdaData?.adverse_reactions?.join('\n'),
        contraindications: fdaData?.contraindications?.join('\n')
      })
      .eq('id', prescriptionId);

    if (updateError) throw updateError;

    // Step 5: Cache FDA data if not exists
    if (fdaData && medicationInfo.medication_name) {
      console.log('Caching FDA data...');
      const { error: drugError } = await supabaseClient
        .from('drugs')
        .upsert({
          name: medicationInfo.medication_name,
          description: fdaData.description?.join('\n'),
          dosage: fdaData.dosage_and_administration?.join('\n'),
          side_effects: fdaData.adverse_reactions?.join('\n'),
          contraindications: fdaData.contraindications?.join('\n'),
          fda_data: fdaData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'name'
        });

      if (drugError) console.error('Error caching FDA data:', drugError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        medication_name: medicationInfo.medication_name,
        dosage: medicationInfo.dosage,
        frequency: medicationInfo.frequency,
        instructions: medicationInfo.instructions,
        side_effects: fdaData?.adverse_reactions?.join('\n'),
        contraindications: fdaData?.contraindications?.join('\n'),
        fdaData: {
          label: fdaData?.description?.join('\n'),
          events: fdaData?.adverse_reactions?.join('\n')
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function performOCR(hf: HfInference, imageBase64: string): Promise<string> {
  try {
    // Convert base64 to blob
    const imageBlob = base64ToBlob(imageBase64);
    
    // Use Microsoft's Donut model for OCR
    const result = await hf.textGeneration({
      model: 'microsoft/donut-base-finetuned-rvlcdip',
      inputs: imageBlob,
    });

    return result.generated_text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to perform OCR on the image');
  }
}

async function analyzeMedicationInfo(text: string) {
  const API_KEY = Deno.env.get('GIMINAI-AI');
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this medical prescription text and extract the following information in JSON format:
                   Text: ${text}
                   
                   Please extract:
                   - medication_name: The name of the medication
                   - dosage: The prescribed dosage
                   - frequency: How often to take the medication
                   - instructions: Special instructions for taking the medication`
          }]
        }]
      })
    });

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;
    
    try {
      return JSON.parse(analysisText);
    } catch {
      // If parsing fails, return a structured object with available information
      return {
        medication_name: null,
        dosage: null,
        frequency: null,
        instructions: null
      };
    }
  } catch (error) {
    console.error('Gemini AI Analysis Error:', error);
    throw new Error('Failed to analyze prescription text');
  }
}

async function fetchFDAData(medicationName: string): Promise<OpenFDAResponse['results'][0] | null> {
  try {
    const FDA_API_URL = Deno.env.get('OPENFDA_API_URL');
    const response = await fetch(
      `${FDA_API_URL}/drug/label.json?search=brand_name:${encodeURIComponent(medicationName)}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`FDA API returned ${response.status}`);
    }

    const data: OpenFDAResponse = await response.json();
    return data.results[0] || null;
  } catch (error) {
    console.error('FDA API Error:', error);
    return null;
  }
}

function base64ToBlob(base64: string): Blob {
  const byteString = atob(base64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([arrayBuffer], { type: 'image/jpeg' });
}
