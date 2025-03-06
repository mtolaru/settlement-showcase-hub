
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
    
    console.log('Starting complete image remapping process...');
    
    // First, reset all photo_url to null for all settlements
    // Fix: Add a WHERE condition that will match all records (id IS NOT NULL)
    const { error: resetError } = await supabase
      .from('settlements')
      .update({ photo_url: null })
      .filter('id', 'not.is', null); // This will affect all settlements but with a proper WHERE clause
      
    if (resetError) {
      console.error('Error resetting settlement photo URLs:', resetError);
      throw new Error(`Failed to reset photo URLs: ${resetError.message}`);
    }
    
    console.log('Reset all settlement photo_url fields to null');
    
    // Get all settlements to process
    const { data: settlements, error: fetchError } = await supabase
      .from('settlements')
      .select('id, temporary_id');
      
    if (fetchError) {
      console.error('Error fetching settlements:', fetchError);
      throw new Error(`Failed to fetch settlements: ${fetchError.message}`);
    }
    
    console.log(`Found ${settlements?.length || 0} settlements to process`);
    
    if (!settlements || settlements.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No settlements found to process',
          updated: 0,
          not_mapped: 0,
          total: 0,
          errors: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // Get a list of all files in the processed_images bucket
    const { data: allBucketFiles, error: bucketError } = await supabase.storage
      .from('processed_images')
      .list('');
      
    if (bucketError) {
      console.error('Error listing bucket files:', bucketError);
      throw new Error(`Failed to list bucket files: ${bucketError.message}`);
    }
    
    console.log(`Found ${allBucketFiles?.length || 0} files in the processed_images bucket`);
    if (allBucketFiles && allBucketFiles.length > 0) {
      console.log('Sample files:', allBucketFiles.slice(0, 5).map(f => f.name));
    }
    
    // Process settlements one by one
    const updatedSettlements = [];
    const notMappedSettlements = [];
    const errors = [];
    
    for (const settlement of settlements) {
      try {
        console.log(`Processing settlement ID: ${settlement.id}, Temporary ID: ${settlement.temporary_id || 'none'}`);
        
        let fileFound = false;
        let mappedFileName = null;
        
        // Try the standard pattern with settlement ID
        const fileName = `settlement_${settlement.id}.jpg`;
        console.log(`Trying standard naming pattern: ${fileName}`);
        
        // First, verify the file exists in the bucket
        const fileExists = allBucketFiles?.some(file => file.name === fileName);
        
        if (fileExists) {
          console.log(`File ${fileName} exists in bucket`);
          mappedFileName = fileName;
          fileFound = true;
        } else {
          console.log(`No file found for settlement ${settlement.id} with filename ${fileName}`);
          
          // Try alternative with temporary ID if available
          if (settlement.temporary_id) {
            const tempFileName = `settlement_${settlement.temporary_id}.jpg`;
            console.log(`Trying temporary ID pattern: ${tempFileName}`);
            
            const tempFileExists = allBucketFiles?.some(file => file.name === tempFileName);
            
            if (tempFileExists) {
              console.log(`File ${tempFileName} exists in bucket`);
              mappedFileName = tempFileName;
              fileFound = true;
            } else {
              console.log(`No file found for settlement ${settlement.id} with temp ID filename ${tempFileName}`);
              
              // Try a broader search - look for any file containing the settlement ID
              const matchingFile = allBucketFiles?.find(file => 
                file.name.includes(String(settlement.id)) ||
                (settlement.temporary_id && file.name.includes(String(settlement.temporary_id)))
              );
              
              if (matchingFile) {
                console.log(`Found matching file via partial search: ${matchingFile.name}`);
                mappedFileName = matchingFile.name;
                fileFound = true;
              } else {
                console.log(`No matching file found for settlement ${settlement.id} using any pattern`);
              }
            }
          } else {
            // No temporary ID, but still try partial matching
            const matchingFile = allBucketFiles?.find(file => file.name.includes(String(settlement.id)));
            
            if (matchingFile) {
              console.log(`Found matching file via partial search: ${matchingFile.name}`);
              mappedFileName = matchingFile.name;
              fileFound = true;
            } else {
              console.log(`No matching file found for settlement ${settlement.id}`);
            }
          }
        }
        
        if (fileFound && mappedFileName) {
          // Update the settlement with the found filename
          const { error: updateError } = await supabase
            .from('settlements')
            .update({ photo_url: mappedFileName })
            .eq('id', settlement.id);
            
          if (updateError) {
            console.error(`Error updating settlement ${settlement.id}:`, updateError);
            errors.push(`Settlement ${settlement.id}: ${updateError.message}`);
          } else {
            console.log(`Mapped settlement ${settlement.id} to photo: ${mappedFileName}`);
            updatedSettlements.push(settlement.id);
          }
        } else {
          console.log(`No image found for settlement ${settlement.id}, leaving photo_url as null`);
          notMappedSettlements.push(settlement.id);
        }
      } catch (err) {
        console.error(`Error processing settlement ${settlement.id}:`, err);
        errors.push(`Settlement ${settlement.id}: ${err.message}`);
      }
    }
    
    // Return the results
    return new Response(
      JSON.stringify({ 
        message: `Completely remapped settlement images. Found matches for ${updatedSettlements.length} settlements. ${notMappedSettlements.length} settlements have no matching images.`,
        updated: updatedSettlements.length,
        not_mapped: notMappedSettlements.length,
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
        details: error.message || "Unknown error",
        message: `Error: ${error.message || "Unknown error"}`,
        updated: 0,
        not_mapped: 0,
        total: 0,
        errors: [error.message || "Unknown error"]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
