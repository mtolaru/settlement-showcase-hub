
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { verifySettlementImageExists } from "@/utils/imageHelpers";

interface SettlementImageProps {
  settlementId: number;
  photoUrl?: string;
  type: string;
  settlementPhase: string | null;
  getSettlementPhaseLabel: (phase: string | null) => string;
  onImageStatus: (status: { loaded: boolean, shouldHide: boolean }) => void;
}

const SettlementImage = ({ 
  settlementId, 
  photoUrl, 
  type, 
  settlementPhase, 
  getSettlementPhaseLabel,
  onImageStatus 
}: SettlementImageProps) => {
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  useEffect(() => {
    const initialUrl = photoUrl || generateSettlementImageUrl(settlementId);
    setImageUrl(initialUrl);
    
    const verifyImage = async () => {
      try {
        const imageExists = await verifySettlementImageExists(settlementId, photoUrl);
        
        if (!imageExists) {
          console.log(`Settlement ${settlementId} has missing or inaccessible image, marking hidden`);
          markSettlementHidden(settlementId);
          onImageStatus({ loaded: false, shouldHide: true });
        }
      } catch (err) {
        console.error(`Error verifying image for settlement ${settlementId}:`, err);
        markSettlementHidden(settlementId);
        onImageStatus({ loaded: false, shouldHide: true });
      }
    };
    
    verifyImage();
  }, [settlementId, photoUrl, onImageStatus]);

  const generateSettlementImageUrl = (id: number): string => {
    const standardUrl = `settlement_${id}.jpg`;
    const { data } = supabase.storage
      .from('processed_images')
      .getPublicUrl(standardUrl);
      
    return data?.publicUrl || "/placeholder.svg";
  };
  
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
  
  const handleImageError = () => {
    console.error(`Error loading image for settlement ${settlementId} (${imageUrl})`);
    setLoadError(true);
    markSettlementHidden(settlementId);
    onImageStatus({ loaded: false, shouldHide: true });
    setImageUrl("/placeholder.svg");
  };
  
  const handleImageLoad = () => {
    if (imageUrl === "/placeholder.svg") {
      markSettlementHidden(settlementId);
      onImageStatus({ loaded: false, shouldHide: true });
    } else {
      setImageLoaded(true);
      setLoadError(false);
      onImageStatus({ loaded: true, shouldHide: false });
    }
  };

  return (
    <div className="relative h-48 bg-neutral-100">
      {!imageLoaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={`${type} case`}
        className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
        <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-neutral-900">
          {type}
        </span>
        {settlementPhase && (
          <span className="bg-primary-100 px-3 py-1 rounded-full text-sm font-medium text-primary-800">
            {getSettlementPhaseLabel(settlementPhase)}
          </span>
        )}
      </div>
    </div>
  );
};

export default SettlementImage;
