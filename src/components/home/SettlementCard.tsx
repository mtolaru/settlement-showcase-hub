
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share2, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Settlement {
  id: number;
  type: string;
  amount: string;
  lawyer: string;
  firm: string;
  firmWebsite?: string;
  location: string;
  date: string;
  photo_url?: string;
}

interface SettlementCardProps {
  settlement: Settlement;
}

const SettlementCard = ({ settlement }: SettlementCardProps) => {
  const navigate = useNavigate();

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
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral-500 hover:text-primary-500"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
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
            Settlement Date: {settlement.date}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SettlementCard;
