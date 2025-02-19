
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getFDAData(drugName: string) {
  try {
    const fdaBaseUrl = 'https://api.fda.gov/drug';
    const responses = await Promise.all([
      fetch(`${fdaBaseUrl}/event.json?search=patient.drug.medicinalproduct:${encodeURIComponent(drugName)}&limit=1`),
      fetch(`${fdaBaseUrl}/label.json?search=openfda.brand_name:${encodeURIComponent(drugName)}&limit=1`)
    ]);
    
    const [eventsData, labelData] = await Promise.all(
      responses.map(async (response) => {
        if (!response.ok) {
          console.log('FDA API error:', await response.text());
          return null;
        }
        return response.json();
      })
    );

    return {
      events: eventsData?.results?.[0],
      label: labelData?.results?.[0]
    };
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
    const { imageBase64, prescriptionId } = await req.json()
    console.log('Starting prescription analysis...')

    const geminiKey = Deno.env.get('GIMINAI-AI')
    if (!geminiKey) {
      throw new Error('Gemini API key is not configured')
    }

    // Analyze with Gemini AI
    const analyzeWithGemini = async () => {
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `أنت خبير في تحليل الوصفات الطبية. قم بتحليل الصورة واستخراج المعلومات التالية:

              المعلومات المطلوبة:
              1. اسم الدواء بالعربية والإنجليزية
              2. الجرعة
              3. عدد مرات الاستخدام
              4. تعليمات الاستخدام
              5. الآثار الجانبية الشائعة
              6. موانع الاستعمال
              7. ملاحظات هامة للمريض

              أرجع JSON object يحتوي على هذه المعلومات بالضبط:
              {
                "medication_name_ar": "الاسم بالعربي",
                "medication_name_en": "English name",
                "dosage": "معلومات الجرعة",
                "frequency": "عدد مرات الاستخدام",
                "instructions": "تعليمات الاستخدام",
                "side_effects": "الآثار الجانبية",
                "contraindications": "موانع الاستعمال",
                "medical_notes": "ملاحظات إضافية"
              }` },
              { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini AI API error: ${await response.text()}`);
      }

      const result = await response.json();
      let analysisText = result.candidates[0].content.parts[0].text;
      
      // Extract the JSON object from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      return JSON.parse(jsonMatch[0]);
    };

    const aiAnalysis = await analyzeWithGemini();
    console.log('AI Analysis complete:', aiAnalysis);

    // Get FDA data
    const fdaData = await getFDAData(aiAnalysis.medication_name_en);
    console.log('FDA Data received:', fdaData);

    // Combine AI and FDA data
    const combinedAnalysis = {
      medication_name: aiAnalysis.medication_name_ar,
      medication_name_en: aiAnalysis.medication_name_en,
      dosage: aiAnalysis.dosage,
      frequency: aiAnalysis.frequency,
      instructions: aiAnalysis.instructions,
      side_effects: aiAnalysis.side_effects,
      contraindications: aiAnalysis.contraindications,
      medical_notes: aiAnalysis.medical_notes
    };

    // Add FDA data if available
    if (fdaData) {
      const { events, label } = fdaData;
      
      if (label) {
        const fdaWarnings = label.warnings_and_cautions || label.warnings || [];
        const fdaDosage = label.dosage_and_administration || [];
        
        combinedAnalysis.medical_notes += '\n\nFDA Information:\n';
        combinedAnalysis.medical_notes += fdaWarnings.join('\n');
        combinedAnalysis.instructions += '\n\nFDA Dosage Information:\n';
        combinedAnalysis.instructions += fdaDosage.join('\n');
      }

      if (events) {
        const fdaReactions = events.patient?.reaction?.map((r: any) => r.reactionmeddrapt).join(', ');
        if (fdaReactions) {
          combinedAnalysis.side_effects += '\n\nFDA Reported Side Effects:\n' + fdaReactions;
        }
      }
    }

    // Update the prescription in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Updating prescription in database...')

    const { error: updateError } = await supabase
      .from('Patient name')
      .update(combinedAnalysis)
      .eq('id', prescriptionId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw updateError
    }

    console.log('Analysis complete and database updated successfully')

    return new Response(
      JSON.stringify(combinedAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-prescription function:', error)
    
    let errorMessage = 'حدث خطأ أثناء تحليل الوصفة الطبية'
    let statusCode = 500
    
    if (error.message.includes('Gemini API key')) {
      errorMessage = 'خطأ في تكوين المفتاح API'
      statusCode = 403
    } else if (error.message.includes('UNAVAILABLE')) {
      errorMessage = 'النظام مشغول حالياً. يرجى المحاولة لاحقاً'
      statusCode = 503
    }

    return new Response(
      JSON.stringify({ error: errorMessage, details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode
      }
    )
  }
})
