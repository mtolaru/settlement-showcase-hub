<lov-codelov-code>
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a settlement image URL from various possible formats
 * @param photoUrl The photo URL or path from the settlement record
 * @param settlementId The settlement ID, used for fallback patterns
 * @returns A fully qualified URL to the image or a placeholder
 */
export const resolveSettlementImageUrl = async (photoUrl?: string | null, settlementId?: number | null): Promise<string> => {
  if (!photoUrl || photoUrl === "") {
    // If no photoUrl provided and we have a settlementId, try the predictable pattern
    if (settlementId) {
      try {
        // Try generating URL using predictable pattern: settlement_ID.jpg
        console.log(`No photo_url provided for settlement ${settlementId}, trying predictable pattern`);
        const predictablePhotoUrl = `settlement_${settlementId}.jpg`;
        
        // First, verify the file exists by checking its metadata
        const { data: metadataData } = await supabase.storage
          .from('processed_images')
          .getPublicUrl(predictablePhotoUrl);
          
        if (metadataData?.publicUrl) {
          // Try a HEAD request to check if the URL is accessible
          try {
            const response = await fetch(metadataData.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              console.log(`Image file exists at public URL: ${metadataData.publicUrl}`);
              return metadataData.publicUrl;
            } else {
              console.log(`Public URL exists but returned status ${response.status}: ${metadataData.publicUrl}`);
            }
          } catch (err) {
            console.log(`Error checking public URL: ${err}`);
          }
        }
        
        // If public URL didn't work, try signed URL
        const { data: fileData, error: fileError } = await supabase.storage
          .from('processed_images')
          .createSignedUrl(predictablePhotoUrl, 60);
          
        if (!fileError && fileData?.signedUrl) {
          console.log(`Generated signed URL for predictable pattern: ${fileData.signedUrl}`);
          return fileData.signedUrl;
        }
        
        console.log(`Could not generate URL using settlement ID pattern: ${fileError?.message || 'File not found'}`);
      } catch (err) {
        console.error(`Error trying to access file for settlement ${settlementId}:`, err);
      }
    }
    
    console.log(`No photo_url provided${settlementId ? ` for settlement ${settlementId}` : ''}, using placeholder`);
    return "/placeholder.svg";
  }
  
  console.log(`Resolving image URL ${photoUrl}${settlementId ? ` for settlement ${settlementId}` : ''}`);
  
  try {
    // If it's already a full URL, verify it's accessible before using it
    if (photoUrl.startsWith('http')) {
      console.log(`Using direct URL: ${photoUrl}`);
      try {
        // Quick check to see if URL is responsive
        const response = await fetch(photoUrl, { method: 'HEAD' });
        if (response.ok) {
          return photoUrl;
        }
        console.log(`Direct URL is not accessible: ${photoUrl} - Status: ${response.status}`);
      } catch (err) {
        console.error(`Error checking URL accessibility: ${photoUrl}`, err);
      }
    }
    
    // Extract the file path - if it includes "processed_images/" prefix, remove it
    let filePath = photoUrl;
    if (photoUrl.startsWith('processed_images/')) {
      filePath = photoUrl.substring('processed_images/'.length);
    }

    console.log(`Extracted file path: ${filePath}`);
    
    // Try getting a public URL first - this is faster
    const { data: publicUrlData } = supabase.storage
      .from('processed_images')
      .getPublicUrl(filePath);
      
    if (publicUrlData?.publicUrl) {
      console.log(`Generated public URL: ${publicUrlData.publicUrl}`);
      
      // Verify the public URL works
      try {
        const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`Verified public URL is accessible`);
          return publicUrlData.publicUrl;
        } else {
          console.log(`Public URL exists but returned status ${response.status}`);
        }
      } catch (err) {
        console.log(`Error checking public URL: ${err}`);
      }
    }
    
    // If public URL didn't work, try a signed URL
    console.log(`Trying to create signed URL for: ${filePath}`);
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('processed_images')
      .createSignedUrl(filePath, 60);
      
    if (!signedUrlError && signedUrlData?.signedUrl) {
      console.log(`Generated signed URL: ${signedUrlData.signedUrl}`);
      return signedUrlData.signedUrl;
    }
    
    console.log(`Error getting signed URL: ${signedUrlError?.message || 'Unknown error'}`);
    
    // If direct path doesn't work, and we have a settlement ID, try with standard naming pattern
    if (settlementId) {
      const standardPath = `settlement_${settlementId}.jpg`;
      console.log(`Trying standard naming pattern: ${standardPath}`);
      
      // Try public URL first
      const { data: standardPublicData } = supabase.storage
        .from('processed_images')
        .getPublicUrl(standardPath);
        
      if (standardPublicData?.publicUrl) {
        try {
          const response = await fetch(standardPublicData.publicUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`Found matching file with standard pattern (public): ${standardPublicData.publicUrl}`);
            
            // Update the database if needed
            if (photoUrl !== standardPath) {
              updateSettlementPhotoUrl(settlementId, standardPath)
                .then(success => {
                  console.log(`Updated settlement ${settlementId} photo_url to ${standardPath}: ${success ? 'success' : 'failed'}`);
                })
                .catch(err => {
                  console.error(`Error updating settlement ${settlementId} photo_url:`, err);
                });
            }
            
            return standardPublicData.publicUrl;
          }
        } catch (err) {
          console.log(`Error checking standard pattern public URL: ${err}`);
        }
      }
      
      // Try signed URL if public URL didn't work
      const { data: standardSignedData, error: standardSignedError } = await supabase.storage
        .from('processed_images')
        .createSignedUrl(standardPath, 60);
        
      if (!standardSignedError && standardSignedData?.signedUrl) {
        console.log(`Found matching file with standard pattern (signed): ${standardSignedData.signedUrl}`);
        
        // If we found a working URL but the database has something different,
        // update the database to have the correct URL for next time
        if (photoUrl !== standardPath) {
          updateSettlementPhotoUrl(settlementId, standardPath)
            .then(success => {
              console.log(`Updated settlement ${settlementId} photo_url to ${standardPath}: ${success ? 'success' : 'failed'}`);
            })
            .catch(err => {
              console.error(`Error updating settlement ${settlementId} photo_url:`, err);
            });
        }
        
        return standardSignedData.signedUrl;
      } else {
        console.log(`Error getting signed URL for standard pattern: ${standardSignedError?.message || 'Unknown error'}`);
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
 * Synchronous version that returns a public URL immediately and updates async
 * For components that need to render without waiting for async operations
 */
export const resolveSettlementImageUrlSync = (photoUrl?: string | null, settlementId?: number | null): string => {
  if (!photoUrl || photoUrl === "") {
    return "/placeholder.svg";
  }
  
  // If it's already a full URL, use it directly
  if (photoUrl.startsWith('http')) {
    return photoUrl;
  }
  
  // Extract the file path - if it includes "processed_images/" prefix, remove it
  let filePath = photoUrl;
  if (photoUrl.startsWith('processed_images/')) {
    filePath = photoUrl.substring('processed_images/'.length);
  }
  
  // Get a public URL synchronously
  const { data } = supabase.storage
    .from('processed_images')
    .getPublicUrl(filePath);
    
  if (data?.publicUrl) {
    // In the background, check if this URL works and update with signed URL if needed
    resolveSettlementImageUrl(photoUrl, settlementId)
      .then(verifiedUrl => {
        // Only log if the URLs are different (likely placeholder vs real image)
        if (verifiedUrl !== data.publicUrl && verifiedUrl !== "/placeholder.svg") {
          console.log(`Async verification found better URL: ${verifiedUrl}`);
        }
      })
      .catch(err => {
        console.error('Error in async image verification:', err);
      });
      
    return data.publicUrl;
  }
  
  return "/placeholder.svg";
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
 * @param photoUrl The photo URL or path to set for the settlement's photo_url
 * @returns True if the update was successful, false otherwise
 */
export const updateSettlementPhotoUrl = async (settlementId: number, photoUrl: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('settlements')
      .update({ photo_url: photoUrl })
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
</lov-code>
