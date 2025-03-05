
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Settlement } from "@/types/settlement";
import { ShareButton } from "@/components/sharing/ShareButton";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface SettlementGridProps {
  settlements: Settlement[];
}

const SettlementGrid = ({ settlements }: SettlementGridProps) => {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch (e) {
      return "N/A";
    }
  };

  const getSettlementPhaseLabel = (phase: string | null) => {
    if (!phase) return "";
    
    switch (phase) {
      case 'pre-litigation':
        return 'Pre-Litigation';
      case 'during-litigation':
        return 'During Litigation';
      case 'post-trial':
        return 'Post-Trial';
      default:
        return phase.charAt(0).toUpperCase() + phase.slice(1);
    }
  };

  const getPublicImageUrl = (settlement: Settlement) => {
    const path = settlement.photo_url;
    if (!path || path === "") return "/placeholder.svg";
    
    // If it's already a full URL, use it directly
    if (path.startsWith('http')) return path;
    
    // Try to extract just the filename
    let filename = path;
    if (path.includes('/')) {
      const parts = path.split('/');
      filename = parts[parts.length - 1];
    }
    
    console.log(`Getting public URL for settlement ${settlement.id}, filename: ${filename} (original: ${path})`);
    
    // Check if the filename has a proper extension, if not, add .jpg
    if (!filename.includes('.')) {
      filename = `${filename}.jpg`;
      console.log(`Added extension to filename: ${filename}`);
    }
    
    // Get the URL with just the filename
    const { data } = supabase.storage
      .from('processed_images')
      .getPublicUrl(filename);
    
    if (data?.publicUrl) {
      console.log(`Generated URL for settlement ${settlement.id}:`, data.publicUrl);
      return data.publicUrl;
    }
    
    // Try with a common naming pattern if the direct filename doesn't work
    const alternativeFilename = `settlement_${settlement.id}.jpg`;
    console.log(`Trying alternative filename for settlement ${settlement.id}: ${alternativeFilename}`);
    
    const altData = supabase.storage
      .from('processed_images')
      .getPublicUrl(alternativeFilename);
      
    if (altData.data?.publicUrl) {
      console.log(`Generated URL with settlement ID pattern for ${settlement.id}:`, altData.data.publicUrl);
      return altData.data.publicUrl;
    }
    
    // Last resort, try the full path
    return supabase.storage
      .from('processed_images')
      .getPublicUrl(path).data?.publicUrl || "/placeholder.svg";
  };

  const handleCardClick = (id: number) => {
    window.location.href = `/settlements/${id}`;
  };

  console.log('Settlement grid items:', settlements);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {settlements.map((settlement, index) => {
        const imageUrl = getPublicImageUrl(settlement);
        console.log(`Final image URL for settlement ${settlement.id}:`, imageUrl);
        
        return (
          <motion.div
            key={settlement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCardClick(settlement.id)}
          >
            <div className="relative">
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
      })}
    </div>
  );
};

export default SettlementGrid;
