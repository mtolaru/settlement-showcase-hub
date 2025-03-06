
import React, { useState } from "react";
import type { Settlement } from "@/types/settlement";
import SettlementsList from "@/components/manage/SettlementsList";
import { settlementService } from "@/services/settlementService";
import { useToast } from "@/components/ui/use-toast";

interface SettlementsSectionProps {
  settlements: Settlement[];
  isLoading: boolean;
  refreshSettlements: () => void;
  userId?: string;
}

const SettlementsSection = ({ 
  settlements, 
  isLoading,
  refreshSettlements,
  userId
}: SettlementsSectionProps) => {
  const { toast } = useToast();

  const handleDeleteSettlement = async (settlementId: number) => {
    try {
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to delete settlements.",
        });
        return;
      }

      console.log(`Attempting to delete settlement ${settlementId} for user ${userId}`);
      await settlementService.deleteSettlement(settlementId, userId);
      refreshSettlements();
      toast({
        title: "Settlement deleted",
        description: "Your settlement has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting settlement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete settlement. Please try again.",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6">My Settlements</h2>
      <SettlementsList 
        settlements={settlements} 
        isLoading={isLoading} 
        onDeleteSettlement={handleDeleteSettlement}
      />
    </div>
  );
};

export default SettlementsSection;
