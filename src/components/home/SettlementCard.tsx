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
  settlementDate?: string; // Added for new settlements
  photo_url?: string;
}

interface SettlementCardProps {
  settlement: Settlement;
}

const SettlementCard = ({ settlement }: SettlementCardProps) => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg");

  useEffect(() => {
    console.log(`Processing photo_url for settlement ${settlement.id}:`, settlement.photo_url);
    
    // Get the proper image URL
    if (settlement.photo_url) {
      // If it's already a full URL, use it directly
      if (settlement.photo_url.startsWith('http')) {
        console.log(`Using direct URL for settlement ${settlement.id}:`, settlement.photo_url);
        setImageUrl(settlement.photo_url);
      } else {
        // Extract the filename from the path
        let filename = settlement.photo_url;
        
        // If the path contains a slash, get just the filename
        if (settlement.photo_url.includes('/')) {
          const parts = settlement.photo_url.split('/');
          filename = parts[parts.length - 1];
        }
        
        console.log(`Extracted filename for settlement ${settlement.id}:`, filename);
        
        // Try to get the public URL from the root of the bucket
        const { data } = supabase.storage
          .from('processed_images')
          .getPublicUrl(filename);
        
        if (data?.publicUrl) {
          console.log(`Generated public URL for ${settlement.id}:`, data.publicUrl);
          setImageUrl(data.publicUrl);
        } else {
          console.error(`Failed to generate URL for settlement ${settlement.id} with filename ${filename}`);
          
          // Try with the full path as a fallback
          const fullPathData = supabase.storage
            .from('processed_images')
            .getPublicUrl(settlement.photo_url);
            
          if (fullPathData.data?.publicUrl) {
            console.log(`Generated public URL using full path for ${settlement.id}:`, fullPathData.data.publicUrl);
            setImageUrl(fullPathData.data.publicUrl);
          }
        }
      }
    } else {
      console.log(`No photo_url for settlement ${settlement.id}, using placeholder`);
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
            console.error(`Error loading image for settlement ${settlement.id} (${imageUrl}):`, e);
            (e.target as HTMLImageElement).src = "/placeholder.svg";
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
