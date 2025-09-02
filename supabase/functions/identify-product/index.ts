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
      // For barcode identification, create mock product data
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
    } else if (imageData) {
      console.log('Making Hugging Face API call for image classification...');
      
      // Convert base64 to blob for Hugging Face API
      const base64Data = imageData;
      const binaryData = atob(base64Data);
      const uint8Array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      
      // Use Hugging Face image classification model
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
        const errorText = await response.text();
        console.error('Hugging Face API error details:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to identify product' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const classifications = await response.json();
      console.log('Hugging Face response received:', classifications);

      // Convert classification to product data
      const topClassification = classifications[0];
      const productData = convertClassificationToProduct(topClassification);
      
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
function convertClassificationToProduct(classification: any) {
  const label = classification.label || 'unknown';
  const score = classification.score || 0;
  
  // Map common classifications to product categories
  const productMappings: { [key: string]: any } = {
    'banana': {
      name: 'Fresh Banana',
      brand: 'Dole',
      category: 'Fruits',
      price: 'S$2.50',
      nutrition: { calories: 89, fat: 0.3, saturatedFat: 0.1, carbs: 23, sugar: 12, protein: 1.1, sodium: 0.001, fiber: 2.6 }
    },
    'apple': {
      name: 'Red Apple',
      brand: 'Fresh Produce',
      category: 'Fruits',
      price: 'S$3.80',
      nutrition: { calories: 52, fat: 0.2, saturatedFat: 0, carbs: 14, sugar: 10, protein: 0.3, sodium: 0.001, fiber: 2.4 }
    },
    'orange': {
      name: 'Fresh Orange',
      brand: 'Sunkist',
      category: 'Fruits',
      price: 'S$4.20',
      nutrition: { calories: 47, fat: 0.1, saturatedFat: 0, carbs: 12, sugar: 9, protein: 0.9, sodium: 0, fiber: 2.4 }
    },
    'bread': {
      name: 'White Bread',
      brand: 'Gardenia',
      category: 'Bakery',
      price: 'S$2.10',
      nutrition: { calories: 265, fat: 3.2, saturatedFat: 0.7, carbs: 49, sugar: 5, protein: 9, sodium: 0.5, fiber: 2.7 }
    },
    'milk': {
      name: 'Fresh Milk',
      brand: 'Magnolia',
      category: 'Dairy',
      price: 'S$3.50',
      nutrition: { calories: 42, fat: 1, saturatedFat: 0.6, carbs: 5, sugar: 5, protein: 3.4, sodium: 0.04, fiber: 0 }
    }
  };
  
  // Find the best match based on the classification label
  const lowerLabel = label.toLowerCase();
  let productData = null;
  
  for (const [key, data] of Object.entries(productMappings)) {
    if (lowerLabel.includes(key) || key.includes(lowerLabel)) {
      productData = data;
      break;
    }
  }
  
  // Default product if no match found
  if (!productData) {
    productData = {
      name: `Identified Product (${label})`,
      brand: 'Generic',
      category: 'Food',
      price: 'S$3.00',
      nutrition: { calories: 100, fat: 2, saturatedFat: 1, carbs: 15, sugar: 5, protein: 3, sodium: 0.2, fiber: 2 }
    };
  }
  
  return {
    ...productData,
    barcode: 'ai-generated',
    scannedAt: new Date().toISOString(),
    scanLocation: 'AI Identified',
    confidence: Math.round(score * 100)
  };
}