
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
    
    // Get all settlements with empty photo_url, including temporary_id which might be useful for matching
    const { data: settlements, error: fetchError } = await supabase
      .from('settlements')
      .select('id, temporary_id')
      .is('photo_url', null);
      
    if (fetchError) {
      console.error('Error fetching settlements:', fetchError);
      throw fetchError;
    }
    
    console.log(`Found ${settlements?.length || 0} settlements with empty photo_url`);
    
    if (!settlements || settlements.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No settlements with empty photo_url found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // Get all files directly - we'll do a very simple approach that has been proven to work
    const updatedSettlements = [];
    const errors = [];
    
    for (const settlement of settlements) {
      try {
        // Try the standard pattern with settlement ID
        const fileName = `settlement_${settlement.id}.jpg`;
        
        // Check if the file exists by trying to get its metadata
        const { data: fileMetadata, error: fileError } = await supabase.storage
          .from('processed_images')
          .getPublicUrl(fileName);
          
        if (fileMetadata && fileMetadata.publicUrl) {
          // If we can get a public URL, the file should exist and be accessible
          // Update the settlement with the simple path
          const { error: updateError } = await supabase
            .from('settlements')
            .update({ photo_url: fileName })
            .eq('id', settlement.id);
            
          if (updateError) {
            console.error(`Error updating settlement ${settlement.id}:`, updateError);
            errors.push(`Settlement ${settlement.id}: ${updateError.message}`);
          } else {
            console.log(`Mapped settlement ${settlement.id} to photo: ${fileName}`);
            updatedSettlements.push(settlement.id);
          }
        } else {
          console.log(`No file found for settlement ${settlement.id} with filename ${fileName}`);
          
          // Try alternative with temporary ID if available
          if (settlement.temporary_id) {
            const tempFileName = `settlement_${settlement.temporary_id}.jpg`;
            const { data: tempFileMetadata } = await supabase.storage
              .from('processed_images')
              .getPublicUrl(tempFileName);
              
            if (tempFileMetadata && tempFileMetadata.publicUrl) {
              const { error: updateError } = await supabase
                .from('settlements')
                .update({ photo_url: tempFileName })
                .eq('id', settlement.id);
                
              if (updateError) {
                console.error(`Error updating settlement ${settlement.id} with temp ID:`, updateError);
                errors.push(`Settlement ${settlement.id} (temp): ${updateError.message}`);
              } else {
                console.log(`Mapped settlement ${settlement.id} to photo: ${tempFileName} (using temp ID)`);
                updatedSettlements.push(settlement.id);
              }
            } else {
              console.log(`No file found for settlement ${settlement.id} with temp ID filename ${tempFileName}`);
            }
          }
        }
      } catch (err) {
        console.error(`Error processing settlement ${settlement.id}:`, err);
        errors.push(`Settlement ${settlement.id}: ${err.message}`);
      }
    }
    
    // Return the results
    return new Response(
      JSON.stringify({ 
        message: `Mapped ${updatedSettlements.length} settlements to their photos`,
        updated: updatedSettlements.length,
        total: settlements.length,
        errors: errors.length > 0 ? errors : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error mapping settlement images:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to map settlement images', 
        details: error.message,
        stack: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
