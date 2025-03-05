
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

    // First, list all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('attorney-photos')
      .list()

    if (listError) {
      return new Response(
        JSON.stringify({ error: 'Failed to list files', details: listError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files found to delete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get file paths
    const filePaths = files.map(file => file.name)
    console.log("Files to delete:", filePaths)

    // Delete the files
    const { error: deleteError } = await supabase.storage
      .from('attorney-photos')
      .remove(filePaths)

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete files', details: deleteError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Now list the processed_images directory if it exists
    const { data: processedFiles, error: processedListError } = await supabase.storage
      .from('attorney-photos')
      .list('processed_images')

    if (!processedListError && processedFiles && processedFiles.length > 0) {
      // Get file paths with the processed_images/ prefix
      const processedFilePaths = processedFiles.map(file => `processed_images/${file.name}`)
      console.log("Processed files to delete:", processedFilePaths)

      // Delete the processed files
      const { error: processedDeleteError } = await supabase.storage
        .from('attorney-photos')
        .remove(processedFilePaths)

      if (processedDeleteError) {
        return new Response(
          JSON.stringify({ 
            warning: 'Deleted root files but failed to delete processed_images files', 
            details: processedDeleteError 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 207 }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'All files deleted successfully', 
        deletedCount: filePaths.length + (processedFiles?.length || 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Deletion error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
