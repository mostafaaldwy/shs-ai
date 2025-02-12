
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function retryWithDelay(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    console.log(`Retrying... ${retries} attempts left`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithDelay(fn, retries - 1, delay * 1.5);
  }
}

async function getFDAData(drugName: string) {
  try {
    const response = await fetch(
      `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:${encodeURIComponent(drugName)}&limit=1`
    );
    
    if (!response.ok) {
      console.log('FDA API error:', await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.results?.[0];
  } catch (error) {
    console.error('Error fetching FDA data:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageData, prescriptionId } = await req.json()
    console.log('Starting prescription analysis...')

    const geminiKey = Deno.env.get('GIMINAI-AI')
    if (!geminiKey) {
      throw new Error('Gemini API key is not configured')
    }

    console.log('Analyzing prescription with Gemini AI...')
    
    const analyzeWithGemini = async () => {
      const prescriptionText = imageData || "No text available";
      console.log('Prescription text:', prescriptionText);
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: `Analyze this medical prescription and extract the following information:

              Required information:
              1. Medication name in Arabic and English
              2. Dosage
              3. Frequency of use
              4. Usage instructions
              5. Common side effects
              6. Contraindications
              7. Important patient notes

              Prescription text: "${prescriptionText}"

              Return ONLY a valid JSON object with these exact keys:
              {
                "medication_name_ar": "Arabic name",
                "medication_name_en": "English name",
                "dosage": "dosage info",
                "frequency": "frequency info",
                "instructions": "usage instructions",
                "side_effects": "side effects list",
                "contraindications": "contraindications list",
                "medical_notes": "additional notes"
              }`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini AI API error: ${errorText}`);
      }

      const result = await response.json();
      return result;
    };

    const geminiResult = await retryWithDelay(analyzeWithGemini);
    console.log('Raw Gemini response:', geminiResult);
    
    const analysisText = geminiResult.candidates[0].content.parts[0].text;
    console.log('Analysis text:', analysisText);
    
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(analysisText.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Failed to parse text:', analysisText);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    console.log('Successfully parsed AI analysis:', aiAnalysis);
    
    // Fetch FDA data for additional safety information
    console.log('Fetching FDA data for:', aiAnalysis.medication_name_en);
    const fdaData = await getFDAData(aiAnalysis.medication_name_en);
    
    // Combine AI analysis with FDA data
    const analysis = {
      medication_name: aiAnalysis.medication_name_ar,
      dosage: aiAnalysis.dosage,
      frequency: aiAnalysis.frequency,
      instructions: aiAnalysis.instructions,
      side_effects: aiAnalysis.side_effects,
      contraindications: aiAnalysis.contraindications,
      medical_notes: aiAnalysis.medical_notes
    };

    // Add FDA safety information if available
    if (fdaData) {
      const fdaSafetyInfo = fdaData.patient?.drug?.[0]?.drugindication || '';
      const fdaReactions = fdaData.patient?.reaction?.map((r: any) => r.reactionmeddrapt).join(', ') || '';
      
      analysis.medical_notes = `${analysis.medical_notes}\n\nمعلومات إضافية من FDA:\nدواعي الاستعمال: ${fdaSafetyInfo}\nردود الفعل المحتملة: ${fdaReactions}`;
    }

    // Update the prescription in the database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Updating prescription in database...')

    const { error: updateError } = await supabase
      .from('Patient name')
      .update({
        medication_name: analysis.medication_name,
        dosage: analysis.dosage,
        frequency: analysis.frequency,
        instructions: analysis.instructions,
        side_effects: analysis.side_effects,
        contraindications: analysis.contraindications,
        medical_notes: analysis.medical_notes
      })
      .eq('id', prescriptionId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw updateError
    }

    console.log('Analysis complete and database updated successfully')

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-prescription function:', error)
    
    let errorMessage = 'حدث خطأ أثناء تحليل الوصفة الطبية'
    let statusCode = 500
    
    if (error.message.includes('Gemini API key is not configured')) {
      errorMessage = 'حدث خطأ في تحليل النص. يرجى المحاولة مرة أخرى'
      statusCode = 403
    } else if (error.message.includes('UNAVAILABLE') || error.message.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'عذراً، النظام مشغول حالياً. يرجى المحاولة بعد دقائق قليلة.'
      statusCode = 503
    } else if (error.message.includes('Failed to parse AI response')) {
      errorMessage = 'حدث خطأ في تحليل استجابة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.'
      statusCode = 500
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        technical_details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode
      }
    )
  }
})
