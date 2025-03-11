
import React, { useState } from "react";
import type { Settlement } from "@/types/settlement";
import SettlementsList from "@/components/manage/SettlementsList";
import { settlementService } from "@/services/settlementService";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DeleteConfirmationDialog from "@/components/manage/DeleteConfirmationDialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settlementToDelete, setSettlementToDelete] = useState<{id: number, type: string} | null>(null);

  const openDeleteDialog = (settlement: Settlement) => {
    setSettlementToDelete({
      id: settlement.id,
      type: settlement.type
    });
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSettlementToDelete(null);
  };

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

      setDeletingId(settlementId);
      console.log(`Attempting to delete settlement ${settlementId} for user ${userId}`);
      
      // Get user email for matching attorney_email
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;
      
      // Get settlement temporary_id for matching
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
      
      // First try direct API call for simpler cases
      if (settlementData.user_id === userId) {
        console.log("Settlement belongs to current user, trying direct deletion");
        const { error: deleteError } = await supabase
          .from('settlements')
          .delete()
          .eq('id', settlementId);
          
        if (!deleteError) {
          console.log("Direct deletion succeeded");
          refreshSettlements();
          toast({
            title: "Settlement deleted",
            description: "Your settlement has been successfully deleted.",
          });
          return;
        }
        
        console.error("Direct deletion failed:", deleteError);
      }
      
      // If direct deletion fails or doesn't apply, use the edge function
      console.log("Trying deletion via edge function");
      const result = await settlementService.deleteSettlement(settlementId, userId);
      
      if (result.success) {
        console.log("Delete operation succeeded:", result);
        refreshSettlements();
        toast({
          title: "Settlement deleted",
          description: "Your settlement has been successfully deleted.",
        });
      } else {
        console.error("Delete operation failed:", result);
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
        onDeleteSettlement={openDeleteDialog}
        deletingId={deletingId}
      />
      
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        settlementId={settlementToDelete?.id || null}
        settlementType={settlementToDelete?.type || ""}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteSettlement}
      />
    </div>
  );
};

export default SettlementsSection;
