
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

    // First, list all files in the processed_images bucket
    const bucketName = 'processed_images';
    
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log("Available buckets:", buckets?.map(b => b.name));
    
    if (!buckets?.find(b => b.name === bucketName)) {
      console.log(`Bucket '${bucketName}' doesn't exist yet, nothing to delete`);
      return new Response(
        JSON.stringify({ message: 'No bucket found to delete images from' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // List all files in the bucket (no folder specified to get everything)
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list()

    console.log("Files in root:", files);

    if (listError) {
      console.error("Error listing files:", listError);
      return new Response(
        JSON.stringify({ error: 'Failed to list files', details: listError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let deletedFiles = [];
    
    // First try to delete files in the root of the bucket
    if (files && files.length > 0) {
      // Get file paths
      const filePaths = files.map(file => file.name);
      console.log("Files to delete from root:", filePaths);

      // Delete the files
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(filePaths);

      if (deleteError) {
        console.error("Error deleting root files:", deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete files', details: deleteError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      deletedFiles = [...filePaths];
    }

    // Try to list files in subdirectories (if any)
    const subfolders = ['processed_images', 'settlement_images'];
    let subfoldersFiles = [];
    
    for (const folder of subfolders) {
      const { data: folderFiles, error: folderListError } = await supabase.storage
        .from(bucketName)
        .list(folder);
      
      if (!folderListError && folderFiles && folderFiles.length > 0) {
        console.log(`Files in ${folder}:`, folderFiles);
        
        // Get file paths with the folder prefix
        const folderFilePaths = folderFiles.map(file => `${folder}/${file.name}`);
        console.log(`Files to delete from ${folder}:`, folderFilePaths);
        
        // Delete the files in this folder
        const { error: folderDeleteError } = await supabase.storage
          .from(bucketName)
          .remove(folderFilePaths);
        
        if (folderDeleteError) {
          console.error(`Error deleting files in ${folder}:`, folderDeleteError);
          // Continue with other folders even if this one fails
        } else {
          subfoldersFiles = [...subfoldersFiles, ...folderFilePaths];
        }
      }
    }

    // If we didn't delete any files, return a message
    if (deletedFiles.length === 0 && subfoldersFiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files found to delete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'Files deleted successfully', 
        deletedCount: deletedFiles.length + subfoldersFiles.length,
        deletedFiles: [...deletedFiles, ...subfoldersFiles]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Deletion error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
