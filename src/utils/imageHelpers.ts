
import { supabase } from "@/integrations/supabase/client";

/**
 * Generate a public URL for an settlement image
 * @param fileName The file name in the storage bucket
 * @returns The full URL to the image
 */
export const generateSettlementImageUrl = (fileName: string): string => {
  const { data } = supabase.storage
    .from('processed_images')
    .getPublicUrl(fileName);
    
  return data?.publicUrl || "/placeholder.svg";
};

/**
 * Verify if a file exists in the storage bucket
 * @param photoUrl The photo URL or path from the settlement record
 * @param settlementId The settlement ID, used for fallback patterns
 * @returns A boolean indicating if the file exists
 */
export const verifyFileExists = async (photoUrl?: string | null, settlementId?: number | null): Promise<boolean> => {
  if (!photoUrl || photoUrl === "") {
    if (!settlementId) return false;
    
    // Try the predictable pattern if we have a settlement ID
    const predictablePhotoUrl = `settlement_${settlementId}.jpg`;
    return await checkFileExistence(predictablePhotoUrl);
  }
  
  // Extract the file path - if it includes "processed_images/" prefix, remove it
  let filePath = photoUrl;
  if (photoUrl.startsWith('processed_images/')) {
    filePath = photoUrl.substring('processed_images/'.length);
  }
  
  // Check if the file exists in the bucket
  const exists = await checkFileExistence(filePath);
  if (exists) return true;
  
  // If direct path doesn't work, and we have a settlement ID, try with standard naming pattern
  if (settlementId) {
    const standardPath = `settlement_${settlementId}.jpg`;
    return await checkFileExistence(standardPath);
  }
  
  return false;
};

/**
 * Helper function to check if a file exists in the storage bucket
 * @param filePath The file path to check
 * @returns A boolean indicating if the file exists
 */
async function checkFileExistence(filePath: string): Promise<boolean> {
  try {
    // Try to get public URL
    const { data: publicUrlData } = supabase.storage
      .from('processed_images')
      .getPublicUrl(filePath);
      
    if (publicUrlData?.publicUrl) {
      try {
        const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          return true;
        }
      } catch {
        // Continue to try other methods
      }
    }
    
    // Try to get file metadata as a way to check existence
    const { data, error } = await supabase.storage
      .from('processed_images')
      .createSignedUrl(filePath, 10);
      
    return !error && !!data;
  } catch {
    return false;
  }
}
