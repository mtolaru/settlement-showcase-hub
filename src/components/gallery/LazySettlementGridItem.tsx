import { lazy, Suspense, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import type { Settlement } from "@/types/settlement";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ShareButton } from "@/components/sharing/ShareButton";
import { resolveSettlementImageUrlSync, resolveSettlementImageUrl } from "@/utils/imageUtils";

interface SettlementGridItemProps {
  settlement: Settlement;
  index: number;
  formatAmount: (amount: number) => string;
  formatDate: (dateString: string | null) => string;
  getSettlementPhaseLabel: (phase: string | null) => string;
  onCardClick: (id: number) => void;
}

// Simple placeholder while the real card loads
const SettlementGridItemPlaceholder = () => (
  <Card className="bg-white rounded-lg shadow-md overflow-hidden h-[450px]">
    <div className="h-48 bg-neutral-100 animate-pulse"></div>
    <div className="p-6">
      <div className="space-y-4">
        <div className="h-8 w-3/4 bg-neutral-100 animate-pulse rounded"></div>
        <div className="h-4 w-1/2 bg-neutral-100 animate-pulse rounded"></div>
        <div className="h-4 w-3/4 bg-neutral-100 animate-pulse rounded"></div>
        <div className="h-4 w-1/2 bg-neutral-100 animate-pulse rounded"></div>
      </div>
    </div>
  </Card>
);

// Import the actual grid item component lazily - moved from SettlementGrid
const SettlementGridItemComponent = ({ 
  settlement, 
  index, 
  formatAmount, 
  formatDate, 
  getSettlementPhaseLabel,
  onCardClick
}: SettlementGridItemProps) => {
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  useEffect(() => {
    // Get a sync URL immediately for fast initial render
    const initialUrl = resolveSettlementImageUrlSync(settlement.photo_url, settlement.id);
    if (initialUrl !== imageUrl) {
      setImageUrl(initialUrl);
    }
    
    // Then get the verified URL asynchronously
    const loadVerifiedImage = async () => {
      try {
        const verifiedUrl = await resolveSettlementImageUrl(settlement.photo_url, settlement.id);
        if (verifiedUrl !== imageUrl) {
          setImageUrl(verifiedUrl);
        }
      } catch (err) {
        console.error(`Error loading verified image for settlement ${settlement.id}:`, err);
      }
    };
    
    loadVerifiedImage();
  }, [settlement.photo_url, settlement.id]);
  
  const handleImageError = () => {
    console.error(`Error loading image for settlement ${settlement.id} (${imageUrl})`);
    setLoadError(true);
    
    // If we haven't already tried the placeholder, use it now
    if (imageUrl !== "/placeholder.svg") {
      setImageUrl("/placeholder.svg");
    }
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setLoadError(false);
  };

  return (
    <motion.div
      key={settlement.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onCardClick(settlement.id)}
    >
      <div className="relative">
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
          <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
            <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-neutral-900">
              {settlement.type}
            </span>
            {settlement.settlement_phase && (
              <span className="bg-primary-100 px-3 py-1 rounded-full text-sm font-medium text-primary-800">
                {getSettlementPhaseLabel(settlement.settlement_phase)}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-3xl font-bold text-primary-500">
                {formatAmount(settlement.amount)}
              </span>
              <p className="text-sm text-neutral-600 mt-1">
                {settlement.type}
              </p>
            </div>
            
            <div onClick={(e) => e.stopPropagation()}>
              <ShareButton
                url={`${window.location.origin}/settlements/${settlement.id}`}
                title={`${formatAmount(settlement.amount)} Settlement - ${settlement.type}`}
                amount={settlement.amount.toString()}
                caseType={settlement.type}
                variant="icon"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-neutral-900">
              {settlement.attorney}
            </h3>
            <p className="text-sm text-neutral-600">
              {settlement.firmWebsite ? (
                <a
                  href={settlement.firmWebsite.startsWith('http') ? settlement.firmWebsite : `https://${settlement.firmWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    window.open(settlement.firmWebsite?.startsWith('http') ? settlement.firmWebsite : `https://${settlement.firmWebsite}`, '_blank');
                  }}
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
              Settlement Date: {formatDate(settlement.settlement_date) || formatDate(settlement.created_at)}
            </p>
            {settlement.case_description && (
              <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                {settlement.case_description}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Wrapper component with Suspense for lazy loading
const LazySettlementGridItem = (props: SettlementGridItemProps) => {
  return (
    <Suspense fallback={<SettlementGridItemPlaceholder />}>
      <SettlementGridItemComponent {...props} />
    </Suspense>
  );
};

export default LazySettlementGridItem;
