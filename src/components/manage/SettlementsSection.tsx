
import React, { useState, useEffect } from "react";
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
  const [lastSubmissionInfo, setLastSubmissionInfo] = useState<{hasUserId: boolean, temporaryId?: string, id?: number, attorney_email?: string, payment_completed?: boolean} | null>(null);

  useEffect(() => {
    const checkLastSubmission = async () => {
      if (!settlements.length) return;
      
      try {
        // Get more information for debugging purposes
        const { data, error } = await supabase
          .from('settlements')
          .select('id, user_id, temporary_id, created_at, attorney_email, payment_completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking last submission:', error);
          return;
        }
        
        if (data) {
          console.log('Last submission info:', data);
          setLastSubmissionInfo({
            hasUserId: !!data.user_id,
            temporaryId: data.temporary_id,
            id: data.id,
            attorney_email: data.attorney_email,
            payment_completed: data.payment_completed
          });
          
          if (data.user_id) {
            console.log(`Last submission (ID: ${data.id}) has user ID: ${data.user_id}`);
          } else {
            console.log(`Last submission (ID: ${data.id}) has NO user ID. Temporary ID: ${data.temporary_id}`);
            
            // Try to link it now if user is logged in and emails match
            if (userId && data.attorney_email) {
              const { data: userData } = await supabase.auth.getUser();
              const userEmail = userData?.user?.email;
              
              if (userEmail && userEmail === data.attorney_email) {
                console.log(`Found matching email for settlement ${data.id}. Attempting to link to user ${userId}`);
                
                const { error: updateError } = await supabase
                  .from('settlements')
                  .update({ user_id: userId })
                  .eq('id', data.id)
                  .is('user_id', null);
                  
                if (updateError) {
                  console.error('Error linking settlement to user:', updateError);
                } else {
                  console.log(`Successfully linked settlement ${data.id} to user ${userId}`);
                  refreshSettlements();
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in checkLastSubmission:', error);
      }
    };
    
    checkLastSubmission();
  }, [settlements, userId, refreshSettlements]);

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
      
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;
      
      if (!settlementData.user_id || settlementData.user_id !== userId) {
        console.log(`Settlement doesn't belong to current user. 
          Settlement user_id: ${settlementData.user_id || 'null'}, 
          Current user_id: ${userId},
          Settlement attorney_email: ${settlementData.attorney_email || 'null'},
          User email: ${userEmail || 'null'}`);
        
        if (userEmail && settlementData.attorney_email === userEmail) {
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
      
      {lastSubmissionInfo && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <h3 className="font-medium text-blue-800">Last Submission Status:</h3>
          <p className="text-sm text-blue-700">
            {lastSubmissionInfo.hasUserId 
              ? "✅ User ID is attached to the last settlement." 
              : "❌ No user ID attached to the last settlement."}
          </p>
          {!lastSubmissionInfo.hasUserId && lastSubmissionInfo.temporaryId && (
            <p className="text-xs text-blue-600 mt-1">
              Temporary ID: {lastSubmissionInfo.temporaryId}
            </p>
          )}
          {lastSubmissionInfo.id && (
            <p className="text-xs text-blue-600">
              Settlement ID: {lastSubmissionInfo.id}
            </p>
          )}
          {lastSubmissionInfo.attorney_email && (
            <p className="text-xs text-blue-600">
              Attorney Email: {lastSubmissionInfo.attorney_email}
            </p>
          )}
          {lastSubmissionInfo.payment_completed !== undefined && (
            <p className="text-xs text-blue-600">
              Payment Status: {lastSubmissionInfo.payment_completed ? "Completed" : "Pending"}
            </p>
          )}
          {userId && !lastSubmissionInfo.hasUserId && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  if (!lastSubmissionInfo.id || !userId) return;
                  
                  try {
                    const { error } = await supabase
                      .from('settlements')
                      .update({ user_id: userId })
                      .eq('id', lastSubmissionInfo.id)
                      .is('user_id', null);
                      
                    if (error) {
                      console.error('Error manually linking settlement:', error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to link settlement. Please try again.",
                      });
                    } else {
                      console.log(`Manually linked settlement ${lastSubmissionInfo.id} to user ${userId}`);
                      toast({
                        title: "Success",
                        description: "Settlement has been linked to your account.",
                      });
                      refreshSettlements();
                    }
                  } catch (error) {
                    console.error('Error in manual linking:', error);
                  }
                }}
              >
                Manually Link This Settlement
              </Button>
            </div>
          )}
        </div>
      )}
      
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
