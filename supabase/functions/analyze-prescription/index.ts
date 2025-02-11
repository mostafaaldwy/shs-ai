
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

    // Initialize Gemini API for text analysis
    const geminiKey = Deno.env.get('GIMINAI-AI')
    if (!geminiKey) {
      throw new Error('Gemini API key is not configured')
    }

    // Use Gemini to analyze the prescription text and identify the medication
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
            text: `Extract medication information from this prescription in Arabic.
            Focus on identifying:
            1. The main medication name (in both Arabic and English if possible)
            2. Dosage instructions
            3. Frequency of use
            
            Text: ${imageData || "لا يوجد نص"}
            
            Format the response as JSON with these keys:
            medication_name_ar, medication_name_en, dosage, frequency`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        }
      }),
    })

    if (!geminiResponse.ok) {
      throw new Error(`Gemini AI API error: ${await geminiResponse.text()}`)
    }

    const geminiResult = await geminiResponse.json()
    const basicAnalysis = JSON.parse(geminiResult.candidates[0].content.parts[0].text)

    // Fetch detailed medication information from Mayo Clinic's API
    const mayoKey = Deno.env.get('MAYO_CLINIC_API_KEY')
    if (!mayoKey) {
      throw new Error('Mayo Clinic API key is not configured')
    }

    console.log('Fetching Mayo Clinic data for:', basicAnalysis.medication_name_en)

    const mayoResponse = await fetch(`https://api.mayoclinic.org/drugs/v1/drugs/search?name=${encodeURIComponent(basicAnalysis.medication_name_en)}`, {
      headers: {
        'Authorization': `Bearer ${mayoKey}`,
        'Content-Type': 'application/json',
      }
    })

    if (!mayoResponse.ok) {
      throw new Error(`Mayo Clinic API error: ${await mayoResponse.text()}`)
    }

    const mayoData = await mayoResponse.json()
    
    // Combine prescription analysis with Mayo Clinic data
    const analysis = {
      medication_name: basicAnalysis.medication_name_ar,
      medication_name_en: basicAnalysis.medication_name_en,
      dosage: basicAnalysis.dosage,
      frequency: basicAnalysis.frequency,
      instructions: mayoData.instructions || "لم يتم العثور على تعليمات محددة",
      side_effects: mayoData.sideEffects || "لم يتم العثور على آثار جانبية محددة",
      contraindications: mayoData.contraindications || "لم يتم العثور على موانع استعمال محددة",
      medical_notes: mayoData.additionalInfo || "لم يتم العثور على ملاحظات إضافية"
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
    
    if (error.message.includes('Mayo Clinic API key is not configured')) {
      errorMessage = 'حدث خطأ في الوصول إلى قاعدة بيانات الأدوية. يرجى المحاولة مرة أخرى'
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
