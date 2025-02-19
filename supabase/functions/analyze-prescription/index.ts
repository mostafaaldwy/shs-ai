
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js'
import cv from 'https://cdn.jsdelivr.net/npm/opencv-wasm/opencv.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function preprocessImage(imageData: string): Promise<ImageData> {
  // Decode base64 image
  const img = await createImageBitmap(await fetch(imageData).then(r => r.blob()));
  
  // Create canvas and get context
  const canvas = new OffscreenCanvas(300, 300);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw and resize image to 300x300
  ctx.drawImage(img, 0, 0, 300, 300);
  
  // Get image data
  const imageDataArray = ctx.getImageData(0, 0, 300, 300);
  
  // Convert to grayscale using OpenCV.js
  const mat = cv.matFromImageData(imageDataArray);
  const grayMat = new cv.Mat();
  cv.cvtColor(mat, grayMat, cv.COLOR_RGBA2GRAY);
  
  // Apply contrast enhancement
  const enhancedMat = new cv.Mat();
  cv.equalizeHist(grayMat, enhancedMat);
  
  // Apply thresholding
  const thresholdMat = new cv.Mat();
  cv.threshold(enhancedMat, thresholdMat, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
  
  // Find contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(thresholdMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  // Sort contours by x-coordinate for proper text order
  const boundingBoxes = [];
  for (let i = 0; i < contours.size(); i++) {
    const rect = cv.boundingRect(contours.get(i));
    boundingBoxes.push({ index: i, x: rect.x, rect });
  }
  boundingBoxes.sort((a, b) => a.x - b.x);
  
  // Create output canvas for visualization
  const outputCanvas = new OffscreenCanvas(300, 300);
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('Failed to get output canvas context');
  
  // Draw original image
  outputCtx.drawImage(img, 0, 0, 300, 300);
  
  // Draw bounding boxes
  outputCtx.strokeStyle = 'red';
  outputCtx.lineWidth = 2;
  boundingBoxes.forEach(({ rect }) => {
    outputCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  });
  
  // Clean up OpenCV matrices
  mat.delete();
  grayMat.delete();
  enhancedMat.delete();
  thresholdMat.delete();
  contours.delete();
  hierarchy.delete();
  
  return outputCtx.getImageData(0, 0, 300, 300);
}

async function extractTextFromImage(imageData: string): Promise<string[]> {
  const processedImage = await preprocessImage(imageData);
  
  // Load TensorFlow.js model for text recognition
  // Note: You would need to train and host your own model
  const model = await tf.loadLayersModel('path_to_your_model/model.json');
  
  // Convert processed image to tensor
  const tensor = tf.browser.fromPixels(processedImage, 1)
    .expandDims(0)
    .toFloat()
    .div(255.0);
  
  // Get predictions
  const predictions = await model.predict(tensor).array();
  
  // Convert predictions to text (this would depend on your model's output format)
  const recognizedText = predictions[0].map((pred: number[]) => {
    // Convert prediction to text based on your character mapping
    return "recognized_character";
  });
  
  return recognizedText;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageBase64, prescriptionId } = await req.json()
    console.log('Starting prescription analysis...')

    // Process image and extract text
    const recognizedText = await extractTextFromImage(imageBase64);
    console.log('Recognized text:', recognizedText);

    // Update the prescription in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('Patient name')
      .update({
        medication_name: recognizedText.join(' '),
        medical_notes: 'Extracted using OCR and CNN'
      })
      .eq('id', prescriptionId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        medication_name: recognizedText.join(' '),
        processing_details: 'Text extracted using CNN-based OCR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-prescription function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'حدث خطأ أثناء معالجة الصورة',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
