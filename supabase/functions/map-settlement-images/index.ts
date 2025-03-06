
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
    
    // First, check what files actually exist in the processed_images bucket
    const { data: existingFiles, error: bucketError } = await supabase.storage
      .from('processed_images')
      .list('');
      
    if (bucketError) {
      console.error('Error listing bucket files:', bucketError);
      throw bucketError;
    }
    
    if (!existingFiles || existingFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No files found in the processed_images bucket',
          action: 'Please upload images before trying to map them to settlements'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Found ${existingFiles.length} files in the processed_images bucket`);
    
    // Extract valid settlement IDs from filenames (assuming format: settlement_ID.jpg)
    const validSettlementIds = new Set();
    const fileMap = new Map();
    
    existingFiles.forEach(file => {
      const match = file.name.match(/settlement_(\d+)\.jpg/i);
      if (match && match[1]) {
        const id = parseInt(match[1], 10);
        validSettlementIds.add(id);
        fileMap.set(id, file.name);
      }
    });
    
    console.log(`Found ${validSettlementIds.size} valid settlement ID patterns in filenames`);
    
    if (validSettlementIds.size === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No valid settlement_ID.jpg patterns found in the bucket',
          files: existingFiles.map(f => f.name) 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // 1. First, reset all incorrect photo_url mappings to null
    const { error: resetError } = await supabase
      .from('settlements')
      .update({ photo_url: null })
      .is('hidden', null); // Only reset non-hidden settlements
      
    if (resetError) {
      console.error('Error resetting photo URLs:', resetError);
      throw resetError;
    }
    
    // 2. Update only the settlements that have matching images in the bucket
    const updates = [];
    const validIdsArray = Array.from(validSettlementIds);
    
    for (const id of validIdsArray) {
      const fileName = fileMap.get(id);
      
      if (fileName) {
        const { error: updateError } = await supabase
          .from('settlements')
          .update({ photo_url: fileName, hidden: false })
          .eq('id', id);
          
        if (updateError) {
          console.error(`Error updating settlement ${id}:`, updateError);
        } else {
          updates.push({ id, fileName });
        }
      }
    }
    
    // 3. Mark all other settlements as hidden
    const { error: hideError } = await supabase
      .from('settlements')
      .update({ hidden: true })
      .is('photo_url', null);
      
    if (hideError) {
      console.error('Error hiding settlements without images:', hideError);
    }
    
    // Return the results
    return new Response(
      JSON.stringify({ 
        message: `Updated ${updates.length} settlements with actual images in the bucket`,
        updated: updates,
        total_files: existingFiles.length,
        valid_patterns: validSettlementIds.size
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
