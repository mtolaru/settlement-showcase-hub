
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {settlements.map((settlement, index) => (
        <motion.div
          key={settlement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="h-full">
            <div className="relative">
              <Link to={`/settlements/${settlement.id}`} className="block">
                <div className="relative h-48 bg-neutral-100">
                  <img
                    src={settlement.photo_url || "/placeholder.svg"}
                    alt={`${settlement.type} case`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-neutral-900">
                      {settlement.type}
                    </span>
                  </div>
                </div>
              </Link>
              
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Link to={`/settlements/${settlement.id}`}>
                    <div>
                      <span className="text-3xl font-bold text-primary-500">
                        {formatAmount(settlement.amount)}
                      </span>
                      <p className="text-sm text-neutral-600 mt-1">
                        {settlement.type}
                      </p>
                    </div>
                  </Link>
                  
                  {/* Share button with stopPropagation */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="z-10"
                  >
                    <ShareButton
                      url={`${window.location.origin}/settlements/${settlement.id}`}
                      title={`${formatAmount(settlement.amount)} Settlement - ${settlement.type}`}
                      amount={settlement.amount.toString()}
                      caseType={settlement.type}
                      variant="icon"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <Link to={`/settlements/${settlement.id}`}>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-neutral-900">
                      {settlement.attorney}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {settlement.firmWebsite ? (
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(settlement.firmWebsite, '_blank');
                          }}
                          className="hover:text-primary-500 transition-colors cursor-pointer"
                        >
                          {settlement.firm}
                        </span>
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
                  </div>
                </Link>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default SettlementGrid;
