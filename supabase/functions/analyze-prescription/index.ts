
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageData, prescriptionId } = await req.json()
    console.log('Starting prescription analysis with medical database...')

    // Check if Micromedex API key is available
    const micromedexKey = Deno.env.get('MICROMEDEX_API_KEY')
    if (!micromedexKey) {
      throw new Error('Micromedex API key is not configured')
    }

    // Initialize Gemini API for text analysis first
    const geminiKey = Deno.env.get('GIMINAI-AI')
    if (!geminiKey) {
      throw new Error('Gemini API key is not configured')
    }

    // First, use Gemini to extract medication name from image text
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey,
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: `Extract only the medication name from this prescription text. Return ONLY the name without any additional text or formatting: ${imageData || "لا يوجد نص"}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
        }
      }),
    })

    if (!geminiResponse.ok) {
      throw new Error(`Gemini AI API error: ${await geminiResponse.text()}`)
    }

    const geminiResult = await geminiResponse.json()
    const medicationName = geminiResult.candidates[0].content.parts[0].text.trim()

    console.log('Extracted medication name:', medicationName)

    // Now query Micromedex API for detailed drug information
    const micromedexResponse = await fetch('https://www.micromedexsolutions.com/micromedex2/librarian/api/v1/drugs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${micromedexKey}`,
      },
      body: JSON.stringify({
        query: medicationName,
        language: 'ar'  // Request Arabic content
      })
    })

    if (!micromedexResponse.ok) {
      console.error('Micromedex API error:', await micromedexResponse.text())
      throw new Error('فشل في الحصول على معلومات الدواء من قاعدة البيانات الطبية')
    }

    const drugInfo = await micromedexResponse.json()
    
    // Structure the drug information
    const analysis = {
      medication_name: drugInfo.name || medicationName,
      dosage: drugInfo.dosage?.adult || "يرجى استشارة الطبيب للجرعة المناسبة",
      frequency: drugInfo.frequency || "حسب توجيهات الطبيب",
      instructions: drugInfo.administration || "حسب إرشادات الطبيب",
      side_effects: drugInfo.sideEffects?.join('، ') || "يرجى مراجعة النشرة الداخلية للدواء",
      contraindications: drugInfo.contraindications?.join('، ') || "يرجى استشارة الطبيب",
      medical_notes: drugInfo.warnings || "لا توجد ملاحظات إضافية"
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
    
    if (error.message.includes('Micromedex API key is not configured')) {
      errorMessage = 'لم يتم تكوين مفتاح API لقاعدة البيانات الطبية'
      statusCode = 403
    } else if (error.message.includes('RESOURCE_EXHAUSTED')) {
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
