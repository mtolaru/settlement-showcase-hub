
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { verifySettlementImageExists } from "@/utils/imageHelpers";

interface ImageVerifierProps {
  settlementId: number;
  photoUrl?: string;
  onVerificationComplete: (result: { exists: boolean }) => void;
}

const ImageVerifier: React.FC<ImageVerifierProps> = ({ 
  settlementId, 
  photoUrl, 
  onVerificationComplete 
}) => {
  useEffect(() => {
    const verifyImage = async () => {
      try {
        const imageExists = await verifySettlementImageExists(settlementId, photoUrl);
        
        if (!imageExists) {
          console.log(`Settlement ${settlementId} has missing or inaccessible image, marking hidden`);
          markSettlementHidden(settlementId);
        }
        
        onVerificationComplete({ exists: imageExists });
      } catch (err) {
        console.error(`Error verifying image for settlement ${settlementId}:`, err);
        markSettlementHidden(settlementId);
        onVerificationComplete({ exists: false });
      }
    };
    
    verifyImage();
  }, [settlementId, photoUrl, onVerificationComplete]);

  const markSettlementHidden = async (settlementId: number) => {
    try {
      const { error } = await supabase
        .from('settlements')
        .update({ hidden: true })
        .eq('id', settlementId);
        
      if (error) {
        console.error(`Failed to mark settlement ${settlementId} as hidden:`, error);
      } else {
        console.log(`Successfully marked settlement ${settlementId} as hidden`);
      }
    } catch (err) {
      console.error(`Error marking settlement ${settlementId} as hidden:`, err);
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default ImageVerifier;
