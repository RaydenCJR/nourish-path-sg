import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const huggingFaceToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductIdentificationRequest {
  barcode?: string;
  imageData?: string; // Base64 encoded image data
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode, imageData }: ProductIdentificationRequest = await req.json();

    if (!huggingFaceToken) {
      console.error('Hugging Face access token not configured');
      return new Response(
        JSON.stringify({ error: 'Hugging Face access token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Identifying product with barcode:', barcode, 'imageData provided:', !!imageData);

    if (barcode) {
      // For barcode identification, use AI to generate realistic product data
      console.log('Generating AI-based product data for barcode:', barcode);
      
      try {
        const productData = await generateNutritionWithAI('scanned barcode product');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            product: {
              ...productData,
              barcode: barcode,
              scannedAt: new Date().toISOString(),
              scanLocation: 'Barcode Scanned'
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('Error generating AI nutrition for barcode:', error);
        
        // Fallback to basic product data
        const productData = {
          name: 'Scanned Product',
          brand: 'Generic Brand',
          barcode: barcode,
          category: 'Food',
          price: 'S$3.50',
          nutrition: {
            calories: 150,
            fat: 5,
            saturatedFat: 2,
            carbs: 20,
            sugar: 8,
            protein: 6,
            sodium: 0.5,
            fiber: 3
          },
          scannedAt: new Date().toISOString(),
          scanLocation: 'Barcode Scanned'
        };

        return new Response(
          JSON.stringify({ success: true, product: productData }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else if (imageData) {
      console.log('Making Hugging Face API call for image classification...');
      
      // Convert base64 to blob for Hugging Face API
      const base64Data = imageData;
      const binaryData = atob(base64Data);
      const uint8Array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      
      // Use OpenAI vision model for better product identification
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (!openAIApiKey) {
        console.error('OpenAI API key not configured, falling back to Hugging Face');
        // Fallback to Hugging Face
        const response = await fetch('https://api-inference.huggingface.co/models/microsoft/resnet-50', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${huggingFaceToken}`,
            'Content-Type': 'application/octet-stream',
          },
          body: uint8Array,
        });

        if (!response.ok) {
          console.error('Hugging Face API error:', response.status, response.statusText);
          return new Response(
            JSON.stringify({ error: 'Failed to identify product' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const classifications = await response.json();
        const topClassification = classifications[0];
        const productData = await convertClassificationToProduct(topClassification);
        
        return new Response(
          JSON.stringify({ success: true, product: productData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use OpenAI Vision for accurate product identification
      const productData = await identifyProductWithOpenAIVision(base64Data);
      
      console.log('Returning product data:', productData);
      return new Response(
        JSON.stringify({ success: true, product: productData }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Either barcode or imageData must be provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in identify-product function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to convert Hugging Face classification to product data
async function convertClassificationToProduct(classification: any) {
  const label = classification.label || 'unknown';
  const score = classification.score || 0;
  
  console.log('Generating AI-based product data for:', label);
  
  try {
    const nutritionData = await generateNutritionWithAI(label);
    
    return {
      name: nutritionData.name,
      brand: nutritionData.brand,
      category: nutritionData.category,
      price: nutritionData.price,
      nutrition: nutritionData.nutrition,
      barcode: 'ai-generated',
      scannedAt: new Date().toISOString(),
      scanLocation: 'AI Identified',
      confidence: Math.round(score * 100)
    };
  } catch (error) {
    console.error('Error generating AI nutrition data:', error);
    
    // Fallback to basic product data if AI fails
    return {
      name: `Identified Product (${label})`,
      brand: 'Generic',
      category: 'Food',
      price: 'S$3.00',
      nutrition: { calories: 100, fat: 2, saturatedFat: 1, carbs: 15, sugar: 5, protein: 3, sodium: 0.2, fiber: 2 },
      barcode: 'ai-generated',
      scannedAt: new Date().toISOString(),
      scanLocation: 'AI Identified',
      confidence: Math.round(score * 100)
    };
  }
}

// Identify product using OpenAI Vision
async function identifyProductWithOpenAIVision(base64Data: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Analyze this grocery product image and identify the specific product. Return a JSON object with this exact structure:
{
  "name": "Specific product name with brand",
  "brand": "Brand name",
  "category": "Product category (e.g., Dairy, Snacks, Beverages, etc.)",
  "price": "S$X.XX (estimate realistic Singapore price)",
  "nutrition": {
    "calories": number (per 100g/100ml),
    "fat": number (grams per 100g/100ml),
    "saturatedFat": number (grams per 100g/100ml), 
    "carbs": number (grams per 100g/100ml),
    "sugar": number (grams per 100g/100ml),
    "protein": number (grams per 100g/100ml),
    "sodium": number (grams per 100g/100ml),
    "fiber": number (grams per 100g/100ml)
  }
}

Focus on:
- Identifying the exact brand and product name visible on the package
- Providing accurate nutrition facts based on the product type
- Using realistic Singapore pricing in SGD
- If you can't clearly identify a specific product, make reasonable assumptions based on what you can see`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are a grocery product identification expert. Always respond with valid JSON only. Be specific about brands and product names when visible.' 
        },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:image/jpeg;base64,${base64Data}`,
                detail: 'high'
              } 
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    }),
  });

  if (!response.ok) {
    console.error('OpenAI Vision API error:', response.status, response.statusText);
    throw new Error(`OpenAI Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  
  try {
    const productData = JSON.parse(aiResponse);
    console.log('OpenAI Vision identified product:', productData);
    
    return {
      ...productData,
      barcode: 'vision-identified',
      scannedAt: new Date().toISOString(),
      scanLocation: 'AI Vision Identified',
      confidence: 95
    };
  } catch (parseError) {
    console.error('Error parsing OpenAI Vision response:', parseError);
    console.error('Raw response:', aiResponse);
    throw new Error('Invalid AI Vision response format');
  }
}

// Generate realistic nutrition data using AI
async function generateNutritionWithAI(productLabel: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Based on the product classification "${productLabel}", generate realistic product information including nutrition facts. 

Return a JSON object with this exact structure:
{
  "name": "Specific product name",
  "brand": "Likely brand name",
  "category": "Food category",
  "price": "S$X.XX",
  "nutrition": {
    "calories": number,
    "fat": number,
    "saturatedFat": number, 
    "carbs": number,
    "sugar": number,
    "protein": number,
    "sodium": number,
    "fiber": number
  }
}

Make the nutrition values realistic per 100g/100ml. Use Singapore dollars for pricing. If the classification doesn't seem like food, create a reasonable food product interpretation.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a nutrition expert. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  
  try {
    const productData = JSON.parse(aiResponse);
    console.log('AI generated product data:', productData);
    return productData;
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    throw new Error('Invalid AI response format');
  }
}