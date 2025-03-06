
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
    
    // First, get a list of all files in the processed_images bucket to have a complete reference
    // This helps us search more efficiently without making many separate API calls
    const { data: allBucketFiles, error: bucketError } = await supabase.storage
      .from('processed_images')
      .list('');
      
    if (bucketError) {
      console.error('Error listing bucket files:', bucketError);
      throw bucketError;
    }
    
    console.log(`Found ${allBucketFiles?.length || 0} files in the processed_images bucket`);
    console.log('Sample files:', allBucketFiles?.slice(0, 5).map(f => f.name));
    
    // Also check for subdirectories in the bucket
    const subdirectories = allBucketFiles?.filter(file => file.id === null) || [];
    
    // If there are subdirectories, we'll need to check them too
    let subdirectoryFiles = [];
    for (const dir of subdirectories) {
      const { data: subFiles, error: subError } = await supabase.storage
        .from('processed_images')
        .list(dir.name);
        
      if (!subError && subFiles) {
        // Map the files to include their subdirectory in the path
        subdirectoryFiles = [
          ...subdirectoryFiles,
          ...subFiles.map(file => ({
            ...file,
            fullPath: `${dir.name}/${file.name}`
          }))
        ];
      }
    }
    
    console.log(`Found ${subdirectoryFiles.length} additional files in subdirectories`);
    
    // Combine all files from the root and subdirectories
    const allFiles = [
      ...(allBucketFiles || []).filter(file => file.id !== null),
      ...subdirectoryFiles
    ];
    
    console.log(`Total files available for mapping: ${allFiles.length}`);
    
    // Process settlements in chunks to avoid hitting any limits
    const chunkSize = 50;
    let updatedCount = 0;
    const errors = [];
    
    for (let i = 0; i < settlements.length; i += chunkSize) {
      const chunk = settlements.slice(i, i + chunkSize);
      const updates = [];
      
      for (const settlement of chunk) {
        try {
          console.log(`Processing settlement ID: ${settlement.id}, Temporary ID: ${settlement.temporary_id || 'none'}`);
          
          // Try multiple file patterns to find a match
          const possiblePatterns = [
            // Standard pattern with settlement ID
            `settlement_${settlement.id}.jpg`,
            `settlement_${settlement.id}.jpeg`,
            `settlement_${settlement.id}.png`,
            
            // Try with temporary ID if available
            ...(settlement.temporary_id ? [
              `settlement_${settlement.temporary_id}.jpg`,
              `settlement_${settlement.temporary_id}.jpeg`,
              `settlement_${settlement.temporary_id}.png`
            ] : []),
            
            // Try other common patterns
            `${settlement.id}.jpg`,
            `${settlement.id}.jpeg`,
            `${settlement.id}.png`,
            
            // Try with temporary ID in other formats
            ...(settlement.temporary_id ? [
              `${settlement.temporary_id}.jpg`,
              `${settlement.temporary_id}.jpeg`,
              `${settlement.temporary_id}.png`
            ] : [])
          ];
          
          // Look for matches in our combined file list
          let matchedFile = null;
          let matchedPattern = null;
          
          for (const pattern of possiblePatterns) {
            // First look for exact match
            const exactMatch = allFiles.find(file => 
              file.name === pattern || (file.fullPath && file.fullPath.endsWith(pattern))
            );
            
            if (exactMatch) {
              matchedFile = exactMatch;
              matchedPattern = pattern;
              console.log(`Found exact match for pattern: ${pattern}`);
              break;
            }
            
            // Then try partial match
            const partialMatches = allFiles.filter(file => 
              file.name.includes(String(settlement.id)) || 
              (settlement.temporary_id && file.name.includes(String(settlement.temporary_id))) ||
              (file.fullPath && (
                file.fullPath.includes(String(settlement.id)) || 
                (settlement.temporary_id && file.fullPath.includes(String(settlement.temporary_id)))
              ))
            );
            
            if (partialMatches.length > 0) {
              matchedFile = partialMatches[0]; // Use the first match
              matchedPattern = partialMatches[0].fullPath || partialMatches[0].name;
              console.log(`Found partial match: ${matchedPattern}`);
              break;
            }
          }
          
          // If we found a match, update the settlement
          if (matchedFile) {
            // Construct the proper path for the photo_url
            const photoPath = matchedFile.fullPath || matchedFile.name;
            
            // Verify we can get a public URL for this file
            const { data: publicUrlData } = supabase.storage
              .from('processed_images')
              .getPublicUrl(photoPath);
              
            if (publicUrlData?.publicUrl) {
              // Add to our batch of updates
              updates.push({ 
                id: settlement.id, 
                photo_url: `processed_images/${photoPath}`
              });
              
              console.log(`Mapped settlement ${settlement.id} to photo: processed_images/${photoPath}`);
            } else {
              console.log(`Warning: Could get match but not public URL for settlement ${settlement.id}`);
            }
          } else {
            console.log(`No matching file found for settlement ${settlement.id}`);
            
            // As a last resort, try a direct list operation with search
            const { data: searchResult } = await supabase.storage
              .from('processed_images')
              .list('', {
                search: String(settlement.id)
              });
              
            if (searchResult && searchResult.length > 0) {
              const foundFile = searchResult[0];
              const photoPath = foundFile.name;
              
              // Verify we can get a public URL
              const { data: publicUrlData } = supabase.storage
                .from('processed_images')
                .getPublicUrl(photoPath);
                
              if (publicUrlData?.publicUrl) {
                updates.push({ 
                  id: settlement.id, 
                  photo_url: `processed_images/${photoPath}`
                });
                
                console.log(`Last resort found match for settlement ${settlement.id}: ${photoPath}`);
              }
            }
          }
        } catch (err) {
          console.error(`Error processing settlement ${settlement.id}:`, err);
          errors.push(`Settlement ${settlement.id}: ${err.message}`);
        }
      }
      
      // Update the database if we found any matches
      if (updates.length > 0) {
        console.log(`Updating ${updates.length} settlements in database...`);
        const { error: updateError } = await supabase
          .from('settlements')
          .upsert(updates);
          
        if (updateError) {
          console.error('Chunk update error:', updateError);
          errors.push(`Batch update error: ${updateError.message}`);
        } else {
          updatedCount += updates.length;
          console.log(`Successfully updated ${updates.length} settlements`);
        }
      }
    }
    
    // Return the results
    return new Response(
      JSON.stringify({ 
        message: `Mapped ${updatedCount} settlements to their photos`,
        updated: updatedCount,
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
