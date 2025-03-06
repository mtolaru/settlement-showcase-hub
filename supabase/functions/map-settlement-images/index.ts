
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
      .select('id, temporary_id')
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
    const errors = [];
    
    for (let i = 0; i < settlements.length; i += chunkSize) {
      const chunk = settlements.slice(i, i + chunkSize);
      const updates = [];
      
      for (const settlement of chunk) {
        try {
          // Try with settlement ID format
          const photoUrl = `settlement_${settlement.id}.jpg`;
          
          // First check if this file exists in storage
          const { data: fileExists } = await supabase.storage
            .from('processed_images')
            .list('', {
              search: photoUrl
            });
            
          if (fileExists && fileExists.length > 0) {
            // Get the public URL for this file
            const { data: publicUrlData } = supabase.storage
              .from('processed_images')
              .getPublicUrl(photoUrl);
              
            if (publicUrlData?.publicUrl) {
              updates.push({ 
                id: settlement.id, 
                // Store the relative path for consistency with the import flow
                photo_url: `processed_images/${photoUrl}`,
              });
              
              console.log(`Mapped settlement ${settlement.id} to photo ${photoUrl}`);
            }
          } else {
            // Alternative: try with temporary_id if it exists
            if (settlement.temporary_id) {
              const tempPhotoUrl = `settlement_${settlement.temporary_id}.jpg`;
              
              const { data: tempFileExists } = await supabase.storage
                .from('processed_images')
                .list('', {
                  search: tempPhotoUrl
                });
                
              if (tempFileExists && tempFileExists.length > 0) {
                // Get the public URL for this file
                const { data: tempPublicUrlData } = supabase.storage
                  .from('processed_images')
                  .getPublicUrl(tempPhotoUrl);
                  
                if (tempPublicUrlData?.publicUrl) {
                  updates.push({ 
                    id: settlement.id, 
                    photo_url: `processed_images/${tempPhotoUrl}`
                  });
                  
                  console.log(`Mapped settlement ${settlement.id} to photo ${tempPhotoUrl} using temporary_id`);
                }
              } else {
                console.log(`No matching image found for settlement ${settlement.id}`);
              }
            } else {
              console.log(`No matching image found for settlement ${settlement.id} and no temporary_id available`);
            }
          }
        } catch (error) {
          console.error(`Error processing settlement ${settlement.id}:`, error);
          errors.push(`Error with settlement ${settlement.id}: ${error.message}`);
        }
      }
      
      // Update the database if we found any matches
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('settlements')
          .upsert(updates);
          
        if (updateError) {
          console.error('Batch update error:', updateError);
          errors.push(`Batch update error: ${updateError.message}`);
        } else {
          updatedCount += updates.length;
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: `Successfully mapped ${updatedCount} settlements to their photos`,
        updated: updatedCount,
        total: settlements.length,
        errors: errors.length > 0 ? errors : undefined
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
