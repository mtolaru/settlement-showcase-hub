
import { useState, useEffect } from "react";
import { generateSettlementImageUrl } from "@/utils/imageHelpers";
import ImageLoader from "./image/ImageLoader";
import ImageTags from "./image/ImageTags";
import ImageVerifier from "./image/ImageVerifier";

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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initialUrl = photoUrl || generateSettlementImageUrl(settlementId);
    setImageUrl(initialUrl);
    setIsLoading(true);
    setImageLoaded(false);
    setLoadError(false);
  }, [settlementId, photoUrl]);
  
  const handleImageError = () => {
    console.error(`Error loading image for settlement ${settlementId} (${imageUrl})`);
    setLoadError(true);
    setIsLoading(false);
    onImageStatus({ loaded: false, shouldHide: true });
    setImageUrl("/placeholder.svg");
  };
  
  const handleImageLoad = () => {
    setIsLoading(false);
    
    if (imageUrl === "/placeholder.svg") {
      onImageStatus({ loaded: false, shouldHide: true });
    } else {
      setImageLoaded(true);
      setLoadError(false);
      onImageStatus({ loaded: true, shouldHide: false });
    }
  };

  const handleVerificationComplete = ({ exists }: { exists: boolean }) => {
    if (!exists) {
      onImageStatus({ loaded: false, shouldHide: true });
    }
  };

  return (
    <div className="relative h-48 bg-neutral-100">
      <ImageVerifier 
        settlementId={settlementId}
        photoUrl={photoUrl}
        onVerificationComplete={handleVerificationComplete}
      />
      
      <ImageLoader isLoading={isLoading && !loadError} />
      
      <img
        src={imageUrl}
        alt={`${type} case`}
        className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      
      <ImageTags
        type={type}
        settlementPhase={settlementPhase}
        getSettlementPhaseLabel={getSettlementPhaseLabel}
      />
    </div>
  );
};

export default SettlementImage;
