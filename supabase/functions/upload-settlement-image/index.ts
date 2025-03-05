
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
    const formData = await req.formData()
    const file = formData.get('file')
    const customFilename = formData.get('customFilename')

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Sanitize filename to remove non-ASCII characters
    const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, '');
    
    // Get file extension
    const fileExt = sanitizedFileName.split('.').pop()
    
    // Create a unique filename
    let filePath = '';
    if (customFilename) {
      // For custom filenames from import, ensure they're stored consistently
      filePath = `${customFilename}.${fileExt}`;
      
      // Log for debugging
      console.log(`Using custom filename: ${filePath}`);
    } else {
      // For uploads from the app, use a predictable pattern with UUID
      filePath = `settlement_${crypto.randomUUID()}.${fileExt}`;
      console.log(`Generated filename: ${filePath}`);
    }
    
    // Standardize path format - ensure all files are stored in processed_images folder
    // but don't duplicate the folder name if it's already there
    if (!filePath.startsWith('processed_images/')) {
      filePath = `processed_images/${filePath}`;
    }
    
    console.log(`Final path for storage: ${filePath}`);

    // Check if bucket exists, if not create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketName = 'processed_images';
    
    if (!buckets?.find(b => b.name === bucketName)) {
      console.log(`Bucket '${bucketName}' doesn't exist, creating it...`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create storage bucket', details: error }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Upload to processed_images bucket with standardized path
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true // Use upsert to replace existing files with same name
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Log the full public URL for debugging
    console.log(`Generated public URL: ${publicUrl}`);
    
    // Store both the full public URL and the relative filepath
    return new Response(
      JSON.stringify({ 
        message: 'File uploaded successfully', 
        filePath,
        publicUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
