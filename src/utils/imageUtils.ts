
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a settlement image URL from various possible formats
 * @param photoUrl The photo URL or path from the settlement record
 * @param settlementId The settlement ID, used for fallback patterns
 * @returns A fully qualified URL to the image or a placeholder
 */
export const resolveSettlementImageUrl = (photoUrl?: string | null, settlementId?: number | null): string => {
  if (!photoUrl || photoUrl === "") {
    console.log(`No photo_url provided${settlementId ? ` for settlement ${settlementId}` : ''}, using placeholder`);
    return "/placeholder.svg";
  }
  
  console.log(`Resolving image URL ${photoUrl}${settlementId ? ` for settlement ${settlementId}` : ''}`);
  
  try {
    // If it's already a full URL, use it directly
    if (photoUrl.startsWith('http')) {
      console.log(`Using direct URL: ${photoUrl}`);
      return photoUrl;
    }
    
    // Handle special case: if the path starts with processed_images/
    // The correct structure should be processed_images/filename.ext
    // But sometimes we might have processed_images/processed_images/filename.ext
    // Let's normalize this
    let normalizedPath = photoUrl;
    
    // Check if path has duplicate "processed_images/" prefix
    if (photoUrl.startsWith('processed_images/processed_images/')) {
      normalizedPath = photoUrl.replace('processed_images/processed_images/', 'processed_images/');
      console.log(`Normalized duplicated path: ${normalizedPath}`);
    }
    
    // Get the bucket and path parts
    let bucket = 'processed_images';
    let path = normalizedPath;
    
    // If the path starts with the bucket name, extract just the path part
    if (normalizedPath.startsWith(`${bucket}/`)) {
      path = normalizedPath.substring(bucket.length + 1);
      console.log(`Extracted path from bucket prefix: ${path}`);
    }
    
    // Use Supabase's getPublicUrl to get the full URL for the file
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    if (data?.publicUrl) {
      console.log(`Generated public URL: ${data.publicUrl}`);
      return data.publicUrl;
    }
    
    // If that doesn't work, try with the original path
    const originalData = supabase.storage
      .from(bucket)
      .getPublicUrl(normalizedPath);
      
    if (originalData.data?.publicUrl) {
      console.log(`Generated public URL using original path: ${originalData.data.publicUrl}`);
      return originalData.data.publicUrl;
    }
    
    // Additional fallback: try using the path directly without the bucket name
    if (!path.startsWith('processed_images/') && !path.startsWith('/')) {
      const directPath = `processed_images/${path}`;
      const directData = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
        
      if (directData.data?.publicUrl) {
        console.log(`Generated public URL using direct path: ${directData.data.publicUrl}`);
        return directData.data.publicUrl;
      }
    }
    
    // If we still can't get a URL and we have a settlement ID, try a pattern with settlement ID
    if (settlementId) {
      const alternativeFilename = `settlement_${settlementId}.jpg`;
      console.log(`Trying alternative filename pattern: ${alternativeFilename}`);
      
      const altData = supabase.storage
        .from(bucket)
        .getPublicUrl(alternativeFilename);
        
      if (altData.data?.publicUrl) {
        console.log(`Generated public URL using ID pattern: ${altData.data.publicUrl}`);
        return altData.data.publicUrl;
      }
    }
    
    console.log(`Could not generate a valid URL, using placeholder`);
    return "/placeholder.svg";
  } catch (error) {
    console.error(`Error processing image URL:`, error);
    return "/placeholder.svg";
  }
};
