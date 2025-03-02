
import { supabase } from "@/integrations/supabase/client";

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

      const { error } = await supabase
        .from('settlements')
        .delete()
        .eq('id', settlementId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Delete settlement error:', error);
      throw error;
    }
  },

  async cancelSubscription(subscriptionId: string) {
    try {
      // Get current JWT
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }
      
      console.log('Calling cancel-subscription endpoint with ID:', subscriptionId);
      
      // First, get the Stripe portal URL for the customer
      const response = await supabase.functions.invoke('cancel-subscription', {
        body: { 
          subscriptionId,
          action: 'get_portal_url'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('Error response from cancel-subscription:', response.error);
        throw response.error;
      }

      console.log('Subscription cancellation response:', response.data);
      
      // Check if we got a portal URL back
      if (response.data?.url) {
        // Return the portal URL to redirect the user
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Could not generate customer portal URL');
      }
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }
};
