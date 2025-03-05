
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Connect to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Get all settlements with empty photo_url
    const { data: settlements, error: fetchError } = await supabase
      .from('settlements')
      .select('id')
      .is('photo_url', null);
      
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`Found ${settlements?.length || 0} settlements with empty photo_url`);
    
    if (!settlements || settlements.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No settlements with empty photo_url found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // Process in chunks to avoid hitting any limits
    const chunkSize = 50;
    let updatedCount = 0;
    
    for (let i = 0; i < settlements.length; i += chunkSize) {
      const chunk = settlements.slice(i, i + chunkSize);
      const updates = [];
      
      for (const settlement of chunk) {
        // For each settlement, generate a photo_url based on its ID
        const photoUrl = `processed_images/settlement_${settlement.id}.jpg`;
        
        // First check if this file exists in storage
        const { data: fileExists } = await supabase.storage
          .from('processed_images')
          .list('', {
            search: `settlement_${settlement.id}.jpg`
          });
          
        if (fileExists && fileExists.length > 0) {
          // If the file exists, update the settlement record
          const { data: publicUrlData } = supabase.storage
            .from('processed_images')
            .getPublicUrl(`settlement_${settlement.id}.jpg`);
            
          if (publicUrlData?.publicUrl) {
            updates.push({ 
              id: settlement.id, 
              // Store the relative path for consistency with the import flow
              photo_url: photoUrl,
            });
            
            console.log(`Mapped settlement ${settlement.id} to photo ${photoUrl}`);
          }
        } else {
          console.log(`No matching file found for settlement ${settlement.id}`);
        }
      }
      
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('settlements')
          .upsert(updates);
          
        if (updateError) {
          console.error('Chunk update error:', updateError);
        } else {
          updatedCount += updates.length;
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: `Successfully mapped ${updatedCount} settlements to their photos`,
        updated: updatedCount,
        total: settlements.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error mapping settlement images:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to map settlement images', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
