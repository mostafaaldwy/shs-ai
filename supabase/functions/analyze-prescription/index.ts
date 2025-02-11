
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
              text: `قم بتحليل هذه الوصفة الطبية باللغة العربية واستخرج المعلومات التالية:
              1. اسم الدواء باللغة العربية
              2. الجرعة المطلوبة
              3. عدد مرات الاستخدام
              4. تعليمات الاستخدام
              5. الآثار الجانبية الشائعة
              6. موانع الاستخدام
              7. ملاحظات مهمة للمريض
              
              النص: ${imageData || "لا يوجد نص"}
              
              قم بإرجاع المعلومات بتنسيق JSON مع هذه المفاتيح:
              medication_name, dosage, frequency, instructions, side_effects, contraindications, medical_notes`
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
    const analysisText = geminiResult.candidates[0].content.parts[0].text;
    
    console.log('Successfully received analysis from Gemini AI');
    
    // Parse the JSON response from Gemini
    const analysis = JSON.parse(analysisText)

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
