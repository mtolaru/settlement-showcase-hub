
import { supabase } from "@/integrations/supabase/client";

export const settlementService = {
  async submitWithSubscription(temporaryId: string, formData: any, unformatNumber: (value: string) => string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log("Submitting settlement with subscription for user:", session?.user?.id);
      console.log("Form data:", formData);
      console.log("Temporary ID:", temporaryId);
      
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
        console.log("Found existing settlement with this temporaryId:", existingSettlement);
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

      console.log("About to insert settlement data:", submissionData);

      const { data, error } = await supabase
        .from('settlements')
        .insert(submissionData)
        .select()
        .single();

      if (error) {
        console.error('Submission error from database:', error);
        throw error;
      }

      console.log("Settlement successfully inserted:", data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Submission error:', error);
      throw error;
    }
  },

  async createCheckoutSession(temporaryId: string, formData: any, unformatNumber: (value: string) => string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log("Creating checkout session for temporaryId:", temporaryId);
      console.log("User ID:", session?.user?.id);
      
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
          console.log("Found existing completed payment for this temporaryId:", existingSettlement.id);
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

        console.log("Creating new settlement record:", submissionData);

        const { error: settlementError } = await supabase
          .from('settlements')
          .insert(submissionData);

        if (settlementError) {
          console.error('Error inserting settlement:', settlementError);
          throw settlementError;
        }
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
        console.error('Error from create-checkout-session function:', response.error);
        throw response.error;
      }

      console.log("Checkout session created successfully:", response.data);
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

      console.log(`Attempting to delete settlement ${settlementId} for user ${userId}`);
      
      // Get the current user's session and email
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;
      
      console.log("Current user email:", userEmail);
      
      // First, try to fetch the settlement to check if it exists
      const { data: settlementData, error: fetchError } = await supabase
        .from('settlements')
        .select('id, user_id, attorney_email, temporary_id')
        .eq('id', settlementId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching settlement:', fetchError);
        throw new Error("Settlement not found");
      }
      
      console.log("Found settlement:", settlementData);
      
      // If the settlement has a temporary_id but no user_id, try to claim it first
      if (settlementData.temporary_id && (!settlementData.user_id || settlementData.user_id !== userId)) {
        console.log(`Attempting to claim settlement with temporary_id ${settlementData.temporary_id}`);
        
        const { error: claimError } = await supabase
          .from('settlements')
          .update({ user_id: userId })
          .eq('id', settlementId);
          
        if (claimError) {
          console.error('Error claiming settlement:', claimError);
        } else {
          console.log("Successfully claimed settlement");
        }
      }
      
      // Try to delete by user_id
      const { data: deleteByUserIdData, error: deleteByUserIdError } = await supabase
        .from('settlements')
        .delete()
        .eq('id', settlementId)
        .eq('user_id', userId)
        .select();
        
      if (!deleteByUserIdError && deleteByUserIdData && deleteByUserIdData.length > 0) {
        console.log('Settlement deleted successfully by user ID');
        return { success: true, data: deleteByUserIdData };
      }
      
      console.log("Could not delete by user_id, trying by email");
      
      // If deletion by user_id failed and we have an email, try by email
      if (userEmail) {
        const { data: deleteByEmailData, error: deleteByEmailError } = await supabase
          .from('settlements')
          .delete()
          .eq('id', settlementId)
          .eq('attorney_email', userEmail)
          .select();
          
        if (!deleteByEmailError && deleteByEmailData && deleteByEmailData.length > 0) {
          console.log('Settlement deleted successfully by attorney email');
          return { success: true, data: deleteByEmailData };
        }
        
        if (deleteByEmailError) {
          console.error('Error deleting settlement by email:', deleteByEmailError);
        }
      }
      
      // As a last resort, try a direct delete without any conditions if the user created this settlement
      if (settlementData.user_id === userId || (userEmail && settlementData.attorney_email === userEmail)) {
        console.log("Attempting direct delete as last resort");
        const { data: directDeleteData, error: directDeleteError } = await supabase
          .from('settlements')
          .delete()
          .eq('id', settlementId)
          .select();
          
        if (!directDeleteError && directDeleteData && directDeleteData.length > 0) {
          console.log('Settlement deleted successfully via direct delete');
          return { success: true, data: directDeleteData };
        }
        
        if (directDeleteError) {
          console.error('Error with direct delete:', directDeleteError);
          throw directDeleteError;
        }
      }
      
      // If we got here, the settlement couldn't be deleted
      throw new Error("Settlement not found or you don't have permission to delete it");
    } catch (error: any) {
      console.error('Delete settlement error:', error);
      throw error;
    }
  }
};
