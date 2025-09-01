import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Identifying product with barcode:', barcode, 'imageData provided:', !!imageData);

    // Create the AI prompt
    let prompt = '';
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a product identification expert. When given a barcode or product image, identify the product and provide detailed nutritional information.

Return your response as a JSON object with this exact structure:
{
  "name": "Product Name",
  "brand": "Brand Name", 
  "barcode": "barcode_number",
  "category": "Product Category",
  "price": "Estimated price in SGD format like S$2.95",
  "nutrition": {
    "calories": number (per 100g),
    "fat": number (in grams),
    "saturatedFat": number (in grams),
    "carbs": number (in grams), 
    "sugar": number (in grams),
    "protein": number (in grams),
    "sodium": number (in grams),
    "fiber": number (in grams)
  }
}

If you cannot identify the product exactly, make educated guesses based on similar products. Always provide realistic nutritional values.`
      }
    ];

    if (barcode) {
      messages.push({
        role: 'user',
        content: `Please identify this product with barcode: ${barcode}. This is likely a product sold in Singapore supermarkets. Provide the product details and nutritional information in the specified JSON format.`
      });
    } else if (imageData) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please identify this product from the image and provide the product details and nutritional information in the specified JSON format.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageData}`
            }
          }
        ]
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Either barcode or imageData must be provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Making OpenAI API call...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('OpenAI API error details:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to identify product' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const aiResponse = data.choices[0].message.content;
    console.log('AI response:', aiResponse);

    let productData;
    try {
      // Try to parse the JSON response
      productData = JSON.parse(aiResponse);
      
      // Add scan metadata
      productData.scannedAt = new Date().toISOString();
      productData.scanLocation = 'AI Identified';
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', aiResponse);
      
      // Fallback with a default product if parsing fails
      productData = {
        name: 'Unknown Product',
        brand: 'Unknown',
        barcode: barcode || 'unknown',
        category: 'Unknown',
        price: 'S$0.00',
        nutrition: {
          calories: 0,
          fat: 0,
          saturatedFat: 0,
          carbs: 0,
          sugar: 0,
          protein: 0,
          sodium: 0,
          fiber: 0
        },
        scannedAt: new Date().toISOString(),
        scanLocation: 'AI Identification Failed'
      };
    }

    console.log('Returning product data:', productData);
    return new Response(
      JSON.stringify({ success: true, product: productData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

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