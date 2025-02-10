
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

    console.log('Starting prescription analysis with Gemini AI...')

    // Check if Gemini API key is available
    const geminiKey = Deno.env.get('GIMINAI-AI')
    if (!geminiKey) {
      throw new Error('Gemini API key is not configured')
    }

    // Initialize Gemini API with better error handling
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `أنت خبير طبي يقوم بتحليل الوصفات الطبية. قم بتحليل النص التالي واستخراج المعلومات التالية باللغة العربية:
                - اسم الدواء
                - الجرعة
                - عدد مرات الاستخدام
                - تعليمات الاستخدام
                - الآثار الجانبية المحتملة
                - موانع الاستعمال
                قم بهيكلة الرد كـ JSON object يحتوي على هذه الحقول.
                
                النص: ${imageData}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 800,
        }
      }),
    })

    console.log('Received Gemini AI response with status:', response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini AI API error:', errorData)
      
      // Handle rate limiting and quota errors
      if (response.status === 429 || errorData.includes('RESOURCE_EXHAUSTED')) {
        return new Response(
          JSON.stringify({ 
            error: 'عذراً، النظام مشغول حالياً. يرجى المحاولة بعد دقائق قليلة.',
            technical_details: errorData 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 503 // Service Unavailable
          }
        )
      }
      
      throw new Error(`Gemini AI API error: ${errorData}`)
    }

    const aiResult = await response.json()
    console.log('Parsed AI response:', aiResult)

    // Extract the response text from Gemini's response structure
    const analysis = JSON.parse(aiResult.candidates[0].content.parts[0].text)

    // Update the prescription in the database with the AI analysis
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
    
    if (error.message.includes('Gemini AI API key is not configured')) {
      errorMessage = 'لم يتم تكوين مفتاح API للذكاء الاصطناعي'
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
