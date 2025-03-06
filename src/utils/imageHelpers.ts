
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
 * @param filePath The path to the file in the bucket
 * @returns True if the file exists and is accessible, false otherwise
 */
export const verifyFileExists = async (filePath: string): Promise<boolean> => {
  try {
    // Try to create a signed URL - this will fail if the file doesn't exist
    const { data, error } = await supabase.storage
      .from('processed_images')
      .createSignedUrl(filePath, 60);
      
    return !error && !!data?.signedUrl;
  } catch (error) {
    console.error(`Error verifying file existence:`, error);
    return false;
  }
};
