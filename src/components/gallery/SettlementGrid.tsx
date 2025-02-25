
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share2, ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface Settlement {
  id: number;
  amount: number;
  type: string;
  firm: string;
  location: string;
  date: string;
}

interface SettlementGridProps {
  settlements: Settlement[];
}

const SettlementGrid = ({ settlements }: SettlementGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {settlements.map((settlement, index) => (
        <motion.div
          key={settlement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-3xl font-bold text-primary-500">
                ${(settlement.amount / 1000000).toFixed(1)}M
              </span>
              <p className="text-sm text-neutral-600">{settlement.type}</p>
            </div>
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4">
            <p className="font-medium text-neutral-900">{settlement.firm}</p>
            <div className="flex items-center gap-1 text-sm text-neutral-600">
              <MapPin className="h-4 w-4" />
              {settlement.location}
            </div>
            <p className="text-sm text-neutral-600">
              Settlement Date: {new Date(settlement.date).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4">
            <Link to={`/settlements/${settlement.id}`}>
              <Button variant="outline" className="w-full">
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SettlementGrid;
