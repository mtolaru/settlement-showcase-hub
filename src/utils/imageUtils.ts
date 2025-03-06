
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a settlement image URL from various possible formats
 * @param photoUrl The photo URL or path from the settlement record
 * @param settlementId The settlement ID, used for fallback patterns
 * @returns A fully qualified URL to the image or a placeholder
 */
export const resolveSettlementImageUrl = (photoUrl?: string | null, settlementId?: number | null): string => {
  if (!photoUrl || photoUrl === "") {
    // If no photoUrl provided and we have a settlementId, try the predictable pattern
    if (settlementId) {
      // Try generating URL using predictable pattern: settlement_ID.jpg
      console.log(`No photo_url provided for settlement ${settlementId}, trying predictable pattern`);
      const predictablePhotoUrl = `settlement_${settlementId}.jpg`;
      
      // Directly get the public URL for this predictable pattern
      const { data } = supabase.storage
        .from('processed_images')
        .getPublicUrl(predictablePhotoUrl);
      
      if (data?.publicUrl) {
        console.log(`Generated public URL for predictable pattern: ${data.publicUrl}`);
        return data.publicUrl;
      }
      console.log(`Could not generate URL using settlement ID pattern, using placeholder`);
    }
    
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
    
    // Simple case: just the filename like "settlement_123.jpg"
    // This is now our preferred format from the mapping function
    if (!photoUrl.includes('/')) {
      const { data } = supabase.storage
        .from('processed_images')
        .getPublicUrl(photoUrl);
        
      if (data?.publicUrl) {
        console.log(`Generated public URL from simple filename: ${data.publicUrl}`);
        return data.publicUrl;
      }
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
      const { data: alternativeData } = supabase.storage
        .from('processed_images')
        .getPublicUrl(`settlement_${settlementId}.jpg`);
        
      if (alternativeData?.publicUrl) {
        console.log(`Generated public URL using ID pattern: ${alternativeData.publicUrl}`);
        return alternativeData.publicUrl;
      }
    }
    
    console.log(`Could not generate a valid URL, using placeholder`);
    return "/placeholder.svg";
  } catch (error) {
    console.error(`Error processing image URL:`, error);
    return "/placeholder.svg";
  }
};

/**
 * Generates a public URL for a settlement image based on the settlement ID
 * This uses the predictable pattern: settlement_ID.jpg
 * @param settlementId The settlement ID
 * @returns A fully qualified URL to the settlement image
 */
export const generateSettlementImageUrl = (settlementId: number): string => {
  const alternativeFilename = `settlement_${settlementId}.jpg`;
  console.log(`Trying alternative filename pattern: ${alternativeFilename}`);
  
  const { data } = supabase.storage
    .from('processed_images')
    .getPublicUrl(alternativeFilename);
    
  if (data?.publicUrl) {
    console.log(`Generated public URL using ID pattern: ${data.publicUrl}`);
    return data.publicUrl;
  }
  
  console.log(`Could not generate URL using settlement ID pattern, using placeholder`);
  return "/placeholder.svg";
};

/**
 * Updates the photo_url field in the settlements table for a specific settlement
 * @param settlementId The ID of the settlement to update
 * @param publicUrl The public URL to set for the settlement's photo_url
 * @returns True if the update was successful, false otherwise
 */
export const updateSettlementPhotoUrl = async (settlementId: number, publicUrl: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('settlements')
      .update({ photo_url: publicUrl })
      .eq('id', settlementId);
    
    if (error) {
      console.error(`Error updating settlement photo URL:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating settlement photo URL:`, error);
    return false;
  }
};
