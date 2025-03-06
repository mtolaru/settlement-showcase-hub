
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShareButton } from "@/components/sharing/ShareButton";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { verifySettlementImageExists } from "@/utils/imageHelpers";

interface Settlement {
  id: number;
  type: string;
  amount: string;
  lawyer: string;
  firm: string;
  firmWebsite?: string;
  location: string;
  date: string; 
  settlementDate?: string;
  photo_url?: string;
}

interface SettlementCardProps {
  settlement: Settlement;
}

const SettlementCard = ({ settlement }: SettlementCardProps) => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [shouldHide, setShouldHide] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Reset states when settlement changes
    setImageLoaded(false);
    setLoadError(false);
    
    // Start with a direct image URL if available
    if (settlement.photo_url) {
      setImageUrl(settlement.photo_url);
    } else {
      // Try the standard naming pattern
      const standardUrl = `settlement_${settlement.id}.jpg`;
      const { data } = supabase.storage
        .from('processed_images')
        .getPublicUrl(standardUrl);
        
      if (data?.publicUrl) {
        setImageUrl(data.publicUrl);
      }
    }
    
    // Verify if the image actually exists
    const verifyImage = async () => {
      try {
        const imageExists = await verifySettlementImageExists(settlement.id, settlement.photo_url);
        
        if (!imageExists) {
          console.log(`Settlement ${settlement.id} has missing image, hiding`);
          markSettlementHidden(settlement.id);
          setShouldHide(true);
        }
      } catch (err) {
        console.error(`Error verifying image for settlement ${settlement.id}:`, err);
        markSettlementHidden(settlement.id);
        setShouldHide(true);
      }
    };
    
    verifyImage();
  }, [settlement.photo_url, settlement.id]);

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

  const handleSettlementClick = (id: number) => {
    navigate(`/settlements/${id}`);
  };
  
  const handleImageError = () => {
    console.error(`Error loading image for settlement ${settlement.id} (${imageUrl})`);
    setLoadError(true);
    
    // Mark the settlement as hidden in the database and hide it in the UI
    markSettlementHidden(settlement.id);
    setShouldHide(true);
    
    // Fall back to placeholder
    if (imageUrl !== "/placeholder.svg") {
      setImageUrl("/placeholder.svg");
    }
  };
  
  const handleImageLoad = () => {
    // If we're loading a placeholder, the settlement should be hidden
    if (imageUrl === "/placeholder.svg") {
      markSettlementHidden(settlement.id);
      setShouldHide(true);
    } else {
      console.log(`Image loaded successfully for settlement ${settlement.id}: ${imageUrl}`);
      setImageLoaded(true);
      setLoadError(false);
    }
  };

  // Don't render this component if the settlement should be hidden
  if (shouldHide) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => handleSettlementClick(settlement.id)}
    >
      <div className="relative h-48 bg-neutral-100">
        {!imageLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={`${settlement.type} case`}
          className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-neutral-900">
            {settlement.type}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-3xl font-bold text-primary-500">
              {settlement.amount}
            </span>
            <p className="text-sm text-neutral-600 mt-1">
              {settlement.type}
            </p>
          </div>
          <ShareButton 
            url={`${window.location.origin}/settlements/${settlement.id}`}
            title={`${settlement.amount} Settlement - ${settlement.type}`}
            amount={settlement.amount}
            caseType={settlement.type}
            variant="icon"
            className="mt-1"
          />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-neutral-900">
            {settlement.lawyer}
          </h3>
          <p className="text-sm text-neutral-600">
            {settlement.firmWebsite ? (
              <a 
                href={settlement.firmWebsite}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-primary-500 transition-colors"
              >
                {settlement.firm}
              </a>
            ) : (
              settlement.firm
            )}
          </p>
          <div className="flex items-center text-sm text-neutral-600">
            <Building2 className="h-4 w-4 mr-1" />
            {settlement.location}
          </div>
          <p className="text-sm text-neutral-600">
            Settlement Date: {settlement.settlementDate || settlement.date}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SettlementCard;
