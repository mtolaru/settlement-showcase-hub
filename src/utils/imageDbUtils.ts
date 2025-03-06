
import { supabase } from "@/integrations/supabase/client";

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
