
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

    console.log('Starting prescription analysis...')

    // Check if OpenAI API key is available
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Initialize OpenAI with better error handling
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using the more cost-effective model
        messages: [
          {
            role: 'system',
            content: `You are a medical expert that analyzes prescriptions. Extract the following information in Arabic:
              - Medication name (اسم الدواء)
              - Dosage (الجرعة)
              - Frequency of use (عدد مرات الاستخدام)
              - Usage instructions (تعليمات الاستخدام)
              - Potential side effects (الآثار الجانبية المحتملة)
              - Contraindications (موانع الاستعمال)
              Structure the response as a JSON object with these fields.`
          },
          {
            role: 'user',
            content: `Analyze this prescription data: ${imageData}`
          }
        ],
        temperature: 0.7, // Added temperature for more consistent responses
        max_tokens: 500 // Limiting response length to reduce token usage
      }),
    })

    console.log('Received OpenAI response with status:', response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      
      // Handle specific error cases
      if (response.status === 429 || errorData.includes('insufficient_quota')) {
        return new Response(
          JSON.stringify({ 
            error: 'عذراً، تم تجاوز حد الاستخدام المسموح به. يرجى المحاولة لاحقاً.',
            technical_details: errorData 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429
          }
        )
      }
      
      throw new Error(`OpenAI API error: ${errorData}`)
    }

    const aiResult = await response.json()
    console.log('Parsed AI response:', aiResult)

    const analysis = JSON.parse(aiResult.choices[0].message.content)

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
    
    // Determine appropriate error message based on error type
    let errorMessage = 'حدث خطأ أثناء تحليل الوصفة الطبية'
    let statusCode = 500
    
    if (error.message.includes('OpenAI API key is not configured')) {
      errorMessage = 'لم يتم تكوين مفتاح API للذكاء الاصطناعي'
      statusCode = 403
    } else if (error.message.includes('insufficient_quota')) {
      errorMessage = 'عذراً، تم تجاوز حد الاستخدام المسموح به. يرجى المحاولة لاحقاً.'
      statusCode = 429
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
