
import React, { useState } from "react";
import type { Settlement } from "@/types/settlement";
import SettlementsList from "@/components/manage/SettlementsList";
import { settlementService } from "@/services/settlementService";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteSettlement = async (settlementId: number) => {
    try {
      // Validate user is logged in
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to delete settlements.",
        });
        return;
      }

      setDeletingId(settlementId);
      console.log(`Attempting to delete settlement ${settlementId} for user ${userId}`);
      
      // First, verify the settlement exists and get its details
      try {
        const { data: settlementData, error: fetchError } = await supabase
          .from('settlements')
          .select('id, user_id, attorney_email, temporary_id')
          .eq('id', settlementId)
          .maybeSingle();
        
        if (fetchError) {
          console.error('Error fetching settlement:', fetchError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to verify settlement. Please try again.",
          });
          return;
        }
        
        if (!settlementData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Settlement not found. It may have been already deleted.",
          });
          return;
        }
        
        console.log("Settlement data before deletion:", settlementData);
        
        // Enhanced: Attempt to associate the settlement with the current user if needed
        if (!settlementData.user_id || settlementData.user_id !== userId) {
          console.log("Settlement doesn't belong to current user, attempting to claim it first");
          
          // Get user email for claiming
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user?.email && settlementData.attorney_email === user.email) {
            console.log("User's email matches settlement attorney_email, attempting to claim");
            
            const { error: claimError } = await supabase
              .from('settlements')
              .update({ user_id: userId })
              .eq('id', settlementId);
              
            if (claimError) {
              console.error("Error claiming settlement by email:", claimError);
            } else {
              console.log("Successfully claimed settlement by email match");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching settlement:", error);
      }
      
      // Proceed with deletion
      const result = await settlementService.deleteSettlement(settlementId, userId);
      
      if (result.success) {
        console.log("Delete operation succeeded:", result);
        refreshSettlements();
        toast({
          title: "Settlement deleted",
          description: "Your settlement has been successfully deleted.",
        });
      } else {
        console.error("Delete operation did not return success=true");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete settlement. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error deleting settlement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete settlement. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6">My Settlements</h2>
      <SettlementsList 
        settlements={settlements} 
        isLoading={isLoading} 
        onDeleteSettlement={handleDeleteSettlement}
        deletingId={deletingId}
      />
    </div>
  );
};

export default SettlementsSection;
