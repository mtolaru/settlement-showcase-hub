
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import SettlementImage from "./SettlementImage";
import SettlementDetails from "./SettlementDetails";
import type { Settlement } from "@/types/settlement";
import { formatAmount, formatDate, getSettlementPhaseLabel } from "@/utils/settlementFormatters";

interface SettlementGridItemProps {
  settlement: Settlement;
  index: number;
  onCardClick: (id: number) => void;
}

const SettlementGridItem = ({ 
  settlement, 
  index,
  onCardClick
}: SettlementGridItemProps) => {
  const [shouldHide, setShouldHide] = useState<boolean>(false);
  
  // Check if settlement is already marked as hidden
  useEffect(() => {
    if (settlement.hidden) {
      setShouldHide(true);
    }
  }, [settlement.hidden]);

  const handleImageStatus = ({ shouldHide: hideImage }: { loaded: boolean, shouldHide: boolean }) => {
    setShouldHide(hideImage);
  };

  if (shouldHide) {
    console.log(`Settlement ${settlement.id} hidden from view (marked as hidden or image missing)`);
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onCardClick(settlement.id)}
    >
      <div className="relative">
        <SettlementImage 
          settlementId={settlement.id}
          photoUrl={settlement.photo_url}
          type={settlement.type}
          settlementPhase={settlement.settlement_phase}
          getSettlementPhaseLabel={getSettlementPhaseLabel}
          onImageStatus={handleImageStatus}
        />
        
        <SettlementDetails
          id={settlement.id}
          amount={settlement.amount}
          type={settlement.type}
          attorney={settlement.attorney}
          firm={settlement.firm}
          firmWebsite={settlement.firmWebsite}
          location={settlement.location}
          settlementDate={settlement.settlement_date}
          createdAt={settlement.created_at}
          caseDescription={settlement.case_description}
          formatAmount={formatAmount}
          formatDate={formatDate}
        />
      </div>
    </motion.div>
  );
};

export default SettlementGridItem;
