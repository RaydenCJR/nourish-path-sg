import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NearbyRequest {
  latitude: number;
  longitude: number;
  radius?: number; // radius in kilometers, default 5km
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { latitude, longitude, radius = 5 }: NearbyRequest = await req.json();

    console.log(`Finding supermarkets near ${latitude}, ${longitude} within ${radius}km`);

    // Get all supermarkets from database
    const { data: supermarkets, error } = await supabase
      .from('supermarkets')
      .select('*');

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Found ${supermarkets?.length || 0} total supermarkets in database`);

    // Calculate distances and filter by radius
    const nearbySupermarkets = supermarkets
      ?.map(supermarket => {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(supermarket.latitude.toString()),
          parseFloat(supermarket.longitude.toString())
        );
        
        return {
          ...supermarket,
          distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
        };
      })
      .filter(supermarket => supermarket.distance <= radius)
      .sort((a, b) => a.distance - b.distance) || [];

    console.log(`Found ${nearbySupermarkets.length} supermarkets within ${radius}km`);

    return new Response(
      JSON.stringify({
        success: true,
        data: nearbySupermarkets,
        count: nearbySupermarkets.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});