
import { supabase } from "@/integrations/supabase/client";

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
 * Verifies if a file exists in the storage bucket
 * @param filePath The path to the file in the bucket or a settlementId
 * @returns True if the file exists and is accessible, false otherwise
 */
export const verifyFileExists = async (filePath: string | number): Promise<boolean> => {
  try {
    // If we received a number, assume it's a settlement ID and convert to filename
    const fileName = typeof filePath === 'number' 
      ? `settlement_${filePath}.jpg` 
      : filePath;
    
    console.log(`Verifying if file exists: ${fileName}`);
    
    // First try to get a public URL
    const { data: publicUrlData } = supabase.storage
      .from('processed_images')
      .getPublicUrl(fileName);
      
    if (publicUrlData?.publicUrl) {
      // Try a HEAD request to verify the URL works
      try {
        const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`Verified file exists via public URL: ${fileName}`);
          return true;
        }
        console.log(`File appears to exist but returned status ${response.status}: ${fileName}`);
      } catch (err) {
        console.log(`Error checking public URL: ${err}`);
      }
    }
    
    // If public URL check failed, try signed URL
    const { data, error } = await supabase.storage
      .from('processed_images')
      .createSignedUrl(fileName, 10);
      
    if (error) {
      console.log(`Error verifying file existence (${fileName}): ${error.message}`);
      return false;
    }
    
    return !!data?.signedUrl;
  } catch (error) {
    console.error(`Error verifying file existence:`, error);
    return false;
  }
};

/**
 * Cache for image existence verification results to avoid repeated checks
 */
const imageExistenceCache: Record<string, boolean> = {};

/**
 * Verifies if an image exists for a settlement, with caching to avoid repeated checks
 * @param settlementId The settlement ID
 * @param photoUrl Optional photo URL from the settlement record
 * @returns Promise resolving to true if the image exists, false otherwise
 */
export const verifySettlementImageExists = async (
  settlementId: number, 
  photoUrl?: string | null
): Promise<boolean> => {
  const cacheKey = `settlement_${settlementId}`;
  
  // Return cached result if available
  if (imageExistenceCache[cacheKey] !== undefined) {
    return imageExistenceCache[cacheKey];
  }

  try {
    // First check the provided photoUrl if it exists
    if (photoUrl) {
      // Extract the file name if it's a path
      const fileName = photoUrl.includes('/') 
        ? photoUrl.split('/').pop() || photoUrl
        : photoUrl;
        
      const photoExists = await verifyFileExists(fileName);
      
      if (photoExists) {
        imageExistenceCache[cacheKey] = true;
        return true;
      }
    }
    
    // If no photoUrl or the photo doesn't exist, try the standard naming pattern
    const standardExists = await verifyFileExists(settlementId);
    
    // Cache and return the result
    imageExistenceCache[cacheKey] = standardExists;
    return standardExists;
  } catch (error) {
    console.error(`Error verifying image for settlement ${settlementId}:`, error);
    imageExistenceCache[cacheKey] = false;
    return false;
  }
};
