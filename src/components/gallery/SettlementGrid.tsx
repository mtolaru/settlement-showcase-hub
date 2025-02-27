
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Settlement } from "@/types/settlement";
import { ShareButton } from "@/components/sharing/ShareButton";

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {settlements.map((settlement, index) => (
        <motion.div
          key={settlement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <Link to={`/settlements/${settlement.id}`}>
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
                    {formatAmount(settlement.amount)}
                  </span>
                  <p className="text-sm text-neutral-600 mt-1">
                    {settlement.type}
                  </p>
                </div>
                <ShareButton
                  url={`${window.location.origin}/settlements/${settlement.id}`}
                  title={`${formatAmount(settlement.amount)} Settlement - ${settlement.type}`}
                  amount={settlement.amount.toString()}
                  caseType={settlement.type}
                  variant="icon"
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-neutral-900">
                  {settlement.attorney}
                </h3>
                <p className="text-sm text-neutral-600">
                  {settlement.firmWebsite ? (
                    <a
                      href={settlement.firmWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
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
                  Settlement Date: {new Date(settlement.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default SettlementGrid;
