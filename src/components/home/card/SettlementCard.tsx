
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import SettlementCardImage from "./SettlementCardImage";
import SettlementCardDetails from "./SettlementCardDetails";

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
  const [shouldHide, setShouldHide] = useState<boolean>(false);
  const { toast } = useToast();

  const handleImageStatus = (status: { loaded: boolean, shouldHide: boolean }) => {
    setShouldHide(status.shouldHide);
  };

  const handleSettlementClick = (id: number) => {
    navigate(`/settlements/${id}`);
  };
  
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      <div className="relative">
        <SettlementCardImage
          settlementId={settlement.id}
          photoUrl={settlement.photo_url}
          type={settlement.type}
          onImageStatus={handleImageStatus}
        />
        
        <SettlementCardDetails
          id={settlement.id}
          amount={settlement.amount}
          type={settlement.type}
          lawyer={settlement.lawyer}
          firm={settlement.firm}
          firmWebsite={settlement.firmWebsite}
          location={settlement.location}
          settlementDate={settlement.settlementDate}
          date={settlement.date}
          onClick={handleLinkClick}
        />
      </div>
    </motion.div>
  );
};

export default SettlementCard;
