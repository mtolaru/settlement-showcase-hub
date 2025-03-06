import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShareButton } from "@/components/sharing/ShareButton";
import { useState, useEffect } from "react";
import { resolveSettlementImageUrlSync, resolveSettlementImageUrl } from "@/utils/imageUtils";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    // Reset states when settlement changes
    setImageLoaded(false);
    setLoadError(false);
    
    // Get a sync URL immediately for fast initial render
    const initialUrl = resolveSettlementImageUrlSync(settlement.photo_url, settlement.id);
    if (initialUrl !== imageUrl) {
      console.log(`Initial image URL for settlement ${settlement.id}: ${initialUrl}`);
      setImageUrl(initialUrl);
    }
    
    // Then get the verified URL asynchronously
    const loadVerifiedImage = async () => {
      try {
        console.log(`Loading verified image for settlement ${settlement.id} (${settlement.photo_url})`);
        const verifiedUrl = await resolveSettlementImageUrl(settlement.photo_url, settlement.id);
        console.log(`Verified image URL for settlement ${settlement.id}: ${verifiedUrl}`);
        
        if (verifiedUrl !== imageUrl) {
          setImageUrl(verifiedUrl);
        }
      } catch (err) {
        console.error(`Error loading verified image for settlement ${settlement.id}:`, err);
      }
    };
    
    loadVerifiedImage();
  }, [settlement.photo_url, settlement.id]);

  const handleSettlementClick = (id: number) => {
    navigate(`/settlements/${id}`);
  };
  
  const handleImageError = () => {
    console.error(`Error loading image for settlement ${settlement.id} (${imageUrl})`);
    setLoadError(true);
    
    // Retry with a different approach if we haven't exceeded retry limit
    if (retryCount < 2) {
      setRetryCount(prevCount => prevCount + 1);
      
      // Force a reload with async method
      resolveSettlementImageUrl(settlement.photo_url, settlement.id)
        .then(newUrl => {
          if (newUrl !== imageUrl && newUrl !== "/placeholder.svg") {
            console.log(`Retry found new URL for settlement ${settlement.id}: ${newUrl}`);
            setImageUrl(newUrl);
          } else if (imageUrl !== "/placeholder.svg") {
            // If no better URL was found, fall back to placeholder
            console.log(`No better URL found for settlement ${settlement.id}, using placeholder`);
            setImageUrl("/placeholder.svg");
          }
        })
        .catch(() => {
          // On error, use placeholder
          if (imageUrl !== "/placeholder.svg") {
            setImageUrl("/placeholder.svg");
          }
        });
    } else if (imageUrl !== "/placeholder.svg") {
      // If we've exceeded retry limit, use placeholder
      setImageUrl("/placeholder.svg");
    }
  };
  
  const handleImageLoad = () => {
    console.log(`Image loaded successfully for settlement ${settlement.id}: ${imageUrl}`);
    setImageLoaded(true);
    setLoadError(false);
  };

  // Skip rendering if the image has failed to load after all retries
  if (loadError && retryCount >= 2 && imageUrl === "/placeholder.svg") {
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
