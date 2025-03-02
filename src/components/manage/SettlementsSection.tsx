
import React from "react";
import type { Settlement } from "@/types/settlement";
import SettlementsList from "@/components/manage/SettlementsList";

interface SettlementsSectionProps {
  settlements: Settlement[];
  isLoading: boolean;
}

const SettlementsSection = ({ 
  settlements, 
  isLoading 
}: SettlementsSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6">My Settlements</h2>
      <SettlementsList 
        settlements={settlements} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default SettlementsSection;
