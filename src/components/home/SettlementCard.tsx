import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShareButton } from "@/components/sharing/ShareButton";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (!settlement.photo_url || settlement.photo_url === "") {
      console.log(`No photo_url for settlement ${settlement.id}, using placeholder`);
      return;
    }
    
    console.log(`Processing photo_url for settlement ${settlement.id}:`, settlement.photo_url);
    
    try {
      // If it's already a full URL, use it directly
      if (settlement.photo_url.startsWith('http')) {
        console.log(`Using direct URL for settlement ${settlement.id}:`, settlement.photo_url);
        setImageUrl(settlement.photo_url);
        return;
      }
      
      // Try to extract just the filename
      let filename = settlement.photo_url;
      
      // Remove any path prefix (processed_images/, etc)
      if (settlement.photo_url.includes('/')) {
        const parts = settlement.photo_url.split('/');
        filename = parts[parts.length - 1];
      }
      
      console.log(`Extracted filename for settlement ${settlement.id}:`, filename);
      
      // Check if the filename has a proper extension, if not, add .jpg
      if (!filename.includes('.')) {
        filename = `${filename}.jpg`;
        console.log(`Added extension to filename: ${filename}`);
      }
      
      // First try to get the URL with just the filename
      const { data } = supabase.storage
        .from('processed_images')
        .getPublicUrl(filename);
      
      if (data?.publicUrl) {
        console.log(`Generated public URL for ${settlement.id} with filename:`, data.publicUrl);
        setImageUrl(data.publicUrl);
      } else {
        // Try with a common naming pattern if the direct filename doesn't work
        const alternativeFilename = `settlement_${settlement.id}.jpg`;
        console.log(`Trying alternative filename: ${alternativeFilename}`);
        
        const altData = supabase.storage
          .from('processed_images')
          .getPublicUrl(alternativeFilename);
          
        if (altData.data?.publicUrl) {
          console.log(`Generated public URL with settlement ID pattern:`, altData.data.publicUrl);
          setImageUrl(altData.data.publicUrl);
        } else {
          // If all else fails, try the full path as provided
          const fullPathData = supabase.storage
            .from('processed_images')
            .getPublicUrl(settlement.photo_url);
            
          if (fullPathData.data?.publicUrl) {
            console.log(`Generated public URL using full path:`, fullPathData.data.publicUrl);
            setImageUrl(fullPathData.data.publicUrl);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing image URL for settlement ${settlement.id}:`, error);
    }
  }, [settlement.photo_url, settlement.id]);

  const handleSettlementClick = (id: number) => {
    navigate(`/settlements/${id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => handleSettlementClick(settlement.id)}
    >
      <div className="relative h-48 bg-neutral-100">
        <img
          src={imageUrl}
          alt={`${settlement.type} case`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.error(`Error loading image for settlement ${settlement.id} (${target.src})`);
            
            // If the current src is not the placeholder, try the placeholder
            if (target.src !== `${window.location.origin}/placeholder.svg`) {
              target.src = "/placeholder.svg";
            }
          }}
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
