
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const settlementService = {
  async submitWithSubscription(temporaryId: string, formData: any, unformatNumber: (value: string) => string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this temporaryId already has a completed payment
      const { data: existingSettlement, error: checkError } = await supabase
        .from('settlements')
        .select('id')
        .eq('temporary_id', temporaryId)
        .eq('payment_completed', true)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing settlement:', checkError);
        throw checkError;
      }

      if (existingSettlement?.id) {
        return { success: true, isExisting: true };
      }

      const submissionData = {
        amount: Number(unformatNumber(formData.amount)),
        attorney: formData.attorneyName,
        firm: formData.firmName,
        firm_website: formData.firmWebsite,
        location: formData.location,
        type: formData.caseType === "Other" ? formData.otherCaseType : formData.caseType,
        description: formData.caseDescription,
        case_description: formData.caseDescription,
        initial_offer: Number(unformatNumber(formData.initialOffer)),
        policy_limit: Number(unformatNumber(formData.policyLimit)),
        medical_expenses: Number(unformatNumber(formData.medicalExpenses)),
        settlement_phase: formData.settlementPhase,
        settlement_date: formData.settlementDate,
        photo_url: formData.photoUrl,
        attorney_email: formData.attorneyEmail,
        user_id: session?.user?.id || null,
        payment_completed: true,
        temporary_id: temporaryId,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('settlements')
        .insert(submissionData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Submission error:', error);
      throw error;
    }
  },

  async createCheckoutSession(temporaryId: string, formData: any, unformatNumber: (value: string) => string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this temporaryId already has a record (to prevent duplicates)
      const { data: existingSettlement, error: checkError } = await supabase
        .from('settlements')
        .select('id, payment_completed')
        .eq('temporary_id', temporaryId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing settlement:', checkError);
      }

      if (existingSettlement?.id) {
        // If we have an existing record with payment completed, just redirect
        if (existingSettlement.payment_completed) {
          return { success: true, isExisting: true };
        }
        
        // Otherwise, continue with the existing record
        console.log("Found existing record for this temporaryId:", existingSettlement.id);
      } else {
        // Create a new record with payment_completed = false
        const submissionData = {
          amount: Number(unformatNumber(formData.amount)),
          attorney: formData.attorneyName,
          firm: formData.firmName,
          firm_website: formData.firmWebsite,
          location: formData.location,
          type: formData.caseType === "Other" ? formData.otherCaseType : formData.caseType,
          description: formData.caseDescription,
          case_description: formData.caseDescription,
          initial_offer: Number(unformatNumber(formData.initialOffer)),
          policy_limit: Number(unformatNumber(formData.policyLimit)),
          medical_expenses: Number(unformatNumber(formData.medicalExpenses)),
          settlement_phase: formData.settlementPhase,
          settlement_date: formData.settlementDate,
          photo_url: formData.photoUrl,
          temporary_id: temporaryId,
          user_id: session?.user?.id,
          attorney_email: formData.attorneyEmail,
          payment_completed: false,
          created_at: new Date().toISOString()
        };

        const { error: settlementError } = await supabase
          .from('settlements')
          .insert(submissionData);

        if (settlementError) throw settlementError;
      }

      const returnUrl = `${window.location.origin}/confirmation?temporaryId=${temporaryId}`;
      
      console.log("Creating checkout session with: ", {
        temporaryId,
        userId: session?.user?.id,
        returnUrl
      });
      
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          temporaryId,
          userId: session?.user?.id,
          returnUrl,
        },
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  async deleteSettlement(settlementId: number, userId: string | undefined) {
    try {
      if (!userId) {
        throw new Error("User ID is required to delete a settlement");
      }

      // First, try to find the settlement to confirm it exists and get its details
      const { data: settlement, error: findError } = await supabase
        .from('settlements')
        .select('id, user_id, temporary_id')
        .eq('id', settlementId)
        .single();

      if (findError) {
        console.error('Error finding settlement:', findError);
        throw findError;
      }

      if (!settlement) {
        throw new Error("Settlement not found");
      }

      console.log('Settlement to delete:', settlement);
      console.log('Current user ID:', userId);

      // Check if this settlement belongs to the user (either by user_id or by temporary_id in user metadata)
      const { data: { user } } = await supabase.auth.getUser();
      const userTemporaryId = user?.user_metadata?.temporaryId;
      
      const isOwner = 
        settlement.user_id === userId || 
        (settlement.temporary_id && userTemporaryId && settlement.temporary_id === userTemporaryId);
      
      if (!isOwner) {
        console.error('User does not own this settlement');
        throw new Error("You don't have permission to delete this settlement");
      }

      // Proceed with deletion
      const { error } = await supabase
        .from('settlements')
        .delete()
        .eq('id', settlementId);

      if (error) {
        console.error('Error deleting settlement:', error);
        throw error;
      }

      console.log('Settlement deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Delete settlement error:', error);
      throw error;
    }
  }
};
