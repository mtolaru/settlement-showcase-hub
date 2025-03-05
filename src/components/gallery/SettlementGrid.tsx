
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Settlement } from "@/types/settlement";
import { ShareButton } from "@/components/sharing/ShareButton";
import { Card, CardContent } from "@/components/ui/card";

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

  const handleCardClick = (id: number) => {
    window.location.href = `/settlements/${id}`;
  };

  // Add debug logging to inspect settlement data
  console.log('Settlement grid items:', settlements);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {settlements.map((settlement, index) => {
        // Log individual settlement for debugging
        console.log(`Settlement ${index} details:`, {
          id: settlement.id,
          amount: settlement.amount,
          initial_offer: settlement.initial_offer,
          policy_limit: settlement.policy_limit,
          medical_expenses: settlement.medical_expenses
        });
        
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
              {/* Photo and type banner */}
              <div className="relative h-48 bg-neutral-100">
                <img
                  src={settlement.photo_url || "/placeholder.svg"}
                  alt={`${settlement.type} case`}
                  className="w-full h-full object-cover"
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
              
              {/* Card content */}
              <div className="p-6">
                {/* Amount and share button row */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-3xl font-bold text-primary-500">
                      {formatAmount(settlement.amount)}
                    </span>
                    <p className="text-sm text-neutral-600 mt-1">
                      {settlement.type}
                    </p>
                  </div>
                  
                  {/* Share button - stop propagation to prevent card click */}
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
                
                {/* Settlement details */}
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
