
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
      
      // Get the current user's email
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;
      
      if (userEmail) {
        console.log('Attempting to claim settlement ownership for email:', userEmail);
        // Try to claim ownership of the settlement if it matches the user's email
        const { error: updateError } = await supabase
          .from('settlements')
          .update({ user_id: userId })
          .match({ 
            id: settlementId, 
            attorney_email: userEmail,
            user_id: null 
          });

        if (updateError) {
          console.error('Error claiming settlement:', updateError);
        }
      }
      
      // Now proceed with deletion using separate queries
      // First try to delete based on user_id
      let { data: userIdData, error: userIdError } = await supabase
        .from('settlements')
        .delete()
        .eq('id', settlementId)
        .eq('user_id', userId)
        .select();

      // If that failed and we have an email, try deleting based on attorney_email
      if (userIdError || (userIdData && userIdData.length === 0)) {
        if (userEmail) {
          console.log('Attempting to delete by attorney email:', userEmail);
          const { data: emailData, error: emailError } = await supabase
            .from('settlements')
            .delete()
            .eq('id', settlementId)
            .eq('attorney_email', userEmail)
            .select();

          if (emailError) {
            console.error('Error deleting settlement by email:', emailError);
            throw emailError;
          }

          if (emailData && emailData.length > 0) {
            console.log('Settlement deleted successfully by attorney email');
            return { success: true, data: emailData };
          }
        }

        // If we got here and there was an error with the userId delete, throw that error
        if (userIdError) {
          console.error('Error deleting settlement by user ID:', userIdError);
          throw userIdError;
        }
      } else {
        console.log('Settlement deleted successfully by user ID');
        return { success: true, data: userIdData };
      }

      // If we got here and nothing was deleted, return an error
      throw new Error("Settlement not found or you don't have permission to delete it");
    } catch (error: any) {
      console.error('Delete settlement error:', error);
      throw error;
    }
  }
};
