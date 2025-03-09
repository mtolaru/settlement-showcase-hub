
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { ShareButton } from "@/components/sharing/ShareButton";

interface SuccessCardProps {
  settlementData: any;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({ settlementData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-8 border border-neutral-200"
    >
      <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CreditCard className="h-8 w-8 text-primary-500" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center">Thank You for Your Submission</h2>
      <p className="text-neutral-600 mb-8 text-center">
        Your settlement details have been received and are now live in our gallery.
      </p>

      {settlementData && (
        <div className="mb-8 p-6 bg-primary-50 rounded-lg">
          <ShareButton
            url={`${window.location.origin}/settlements/${settlementData.id}`}
            title={`$${settlementData.amount.toLocaleString()} Settlement - ${settlementData.type}`}
            amount={settlementData.amount.toString()}
            caseType={settlementData.type}
            variant="full"
          />
        </div>
      )}
      
      <div className="space-y-4">
        <Link to="/settlements">
          <Button className="w-full">View Settlement Gallery</Button>
        </Link>
        <Link to="/submit">
          <Button variant="outline" className="w-full">
            Submit Another Settlement
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};
