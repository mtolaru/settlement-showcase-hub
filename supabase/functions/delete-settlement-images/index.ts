
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Starting to delete settlement images");
    
    // First, list all buckets to ensure the one we need exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return new Response(
        JSON.stringify({ error: 'Failed to list buckets', details: bucketsError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    console.log("Available buckets:", buckets?.map(b => b.name));
    
    const bucketName = 'processed_images';
    if (!buckets?.find(b => b.name === bucketName)) {
      console.log(`Bucket '${bucketName}' doesn't exist yet, nothing to delete`);
      return new Response(
        JSON.stringify({ message: 'No bucket found to delete images from' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // Get all files in the root directory of the bucket
    const { data: rootFiles, error: rootListError } = await supabase.storage
      .from(bucketName)
      .list();

    if (rootListError) {
      console.error("Error listing files in root:", rootListError);
      return new Response(
        JSON.stringify({ error: 'Failed to list files in root', details: rootListError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log(`Found ${rootFiles?.length || 0} files in the root directory:`, rootFiles);
    
    // Track all deleted files
    let allDeletedFiles = [];
    
    // Delete files in the root directory if there are any
    if (rootFiles && rootFiles.length > 0) {
      const rootFilePaths = rootFiles.map(file => file.name);
      console.log("Attempting to delete files from root:", rootFilePaths);
      
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(rootFilePaths);
      
      if (deleteError) {
        console.error("Error deleting files from root:", deleteError);
      } else {
        console.log("Successfully deleted files from root:", deleteData);
        allDeletedFiles = [...rootFilePaths];
      }
    }
    
    // List of possible subdirectories to check
    const possibleSubdirs = ['', 'processed_images', 'settlement_images'];
    
    // Check each subdirectory
    for (const subdir of possibleSubdirs) {
      try {
        console.log(`Checking for files in subdirectory: '${subdir || 'root'}'`);
        
        const { data: subdirFiles, error: subdirListError } = await supabase.storage
          .from(bucketName)
          .list(subdir);
        
        if (subdirListError) {
          console.error(`Error listing files in '${subdir}':`, subdirListError);
          continue;
        }
        
        console.log(`Found ${subdirFiles?.length || 0} files in '${subdir || 'root'}':`, subdirFiles);
        
        // If there are files, delete them
        if (subdirFiles && subdirFiles.length > 0) {
          // Generate full paths including the subdirectory
          const subdirFilePaths = subdirFiles.map(file => 
            subdir ? `${subdir}/${file.name}` : file.name
          );
          
          console.log(`Attempting to delete ${subdirFilePaths.length} files from '${subdir || 'root'}':`, subdirFilePaths);
          
          const { data: subdirDeleteData, error: subdirDeleteError } = await supabase.storage
            .from(bucketName)
            .remove(subdirFilePaths);
          
          if (subdirDeleteError) {
            console.error(`Error deleting files from '${subdir || 'root'}':`, subdirDeleteError);
          } else {
            console.log(`Successfully deleted files from '${subdir || 'root'}':`, subdirDeleteData);
            allDeletedFiles = [...allDeletedFiles, ...subdirFilePaths];
          }
        }
      } catch (e) {
        console.error(`Error processing subdirectory '${subdir}':`, e);
      }
    }
    
    // Look for specific settlement image files by pattern
    for (let i = 1; i <= 200; i++) {
      try {
        const filename = `settlement_${i}.jpg`;
        console.log(`Checking if specific file exists: ${filename}`);
        
        // Try to delete this specific file
        const { data: specificDeleteData, error: specificDeleteError } = await supabase.storage
          .from(bucketName)
          .remove([filename]);
        
        if (!specificDeleteError && specificDeleteData && specificDeleteData.length > 0) {
          console.log(`Successfully deleted specific file: ${filename}`);
          allDeletedFiles.push(filename);
        }
      } catch (e) {
        // Ignore errors for specific files as they may not exist
      }
    }
    
    // Return the results
    if (allDeletedFiles.length === 0) {
      console.log("No files were deleted");
      return new Response(
        JSON.stringify({ 
          message: 'No files found to delete', 
          checkedLocations: [...possibleSubdirs.map(dir => dir || 'root directory')]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    console.log(`Successfully deleted ${allDeletedFiles.length} files:`, allDeletedFiles);
    return new Response(
      JSON.stringify({ 
        message: 'Files deleted successfully', 
        deletedCount: allDeletedFiles.length,
        deletedFiles: allDeletedFiles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Deletion error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
