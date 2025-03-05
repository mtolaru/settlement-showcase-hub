
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
    
    // Compare path patterns between created and imported settlements
    
    // First try: Get just the filename (handles both cases with or without processed_images prefix)
    let filename = photoUrl;
    
    // Remove any path prefix (processed_images/, etc)
    if (photoUrl.includes('/')) {
      const parts = photoUrl.split('/');
      filename = parts[parts.length - 1];
      console.log(`Extracted filename from path: ${filename}`);
    }
    
    // Check if the filename has a proper extension, if not, add .jpg
    if (!filename.includes('.')) {
      filename = `${filename}.jpg`;
      console.log(`Added extension to filename: ${filename}`);
    }
    
    // Try getting URL with the filename directly from processed_images bucket
    const { data } = supabase.storage
      .from('processed_images')
      .getPublicUrl(filename);
    
    if (data?.publicUrl) {
      console.log(`Generated public URL using filename: ${data.publicUrl}`);
      return data.publicUrl;
    }
    
    // Second try: If that doesn't work and we have a settlement ID, try a pattern with settlement ID
    if (settlementId) {
      const alternativeFilename = `settlement_${settlementId}.jpg`;
      console.log(`Trying alternative filename pattern: ${alternativeFilename}`);
      
      const altData = supabase.storage
        .from('processed_images')
        .getPublicUrl(alternativeFilename);
        
      if (altData.data?.publicUrl) {
        console.log(`Generated public URL using ID pattern: ${altData.data.publicUrl}`);
        return altData.data.publicUrl;
      }
    }
    
    // Third try: Try with full 'processed_images/' prefix
    let prefixedPath = photoUrl;
    if (!prefixedPath.startsWith('processed_images/')) {
      prefixedPath = `processed_images/${prefixedPath}`;
    }
    
    console.log(`Trying with prefixed path: ${prefixedPath}`);
    const prefixedData = supabase.storage
      .from('processed_images')
      .getPublicUrl(prefixedPath);
      
    if (prefixedData.data?.publicUrl) {
      console.log(`Generated public URL using prefixed path: ${prefixedData.data.publicUrl}`);
      return prefixedData.data.publicUrl;
    }
    
    // Last attempt: Try the original path as provided
    console.log(`Falling back to original path: ${photoUrl}`);
    const originalData = supabase.storage
      .from('processed_images')
      .getPublicUrl(photoUrl);
      
    if (originalData.data?.publicUrl) {
      console.log(`Generated public URL using original path: ${originalData.data.publicUrl}`);
      return originalData.data.publicUrl;
    } 
    
    console.log(`Could not generate a valid URL, using placeholder`);
    return "/placeholder.svg";
  } catch (error) {
    console.error(`Error processing image URL:`, error);
    return "/placeholder.svg";
  }
};
