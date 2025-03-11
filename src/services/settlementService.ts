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
        
        // If a user is logged in but the settlement doesn't have a user_id, update it
        if (session?.user?.id) {
          const { error: updateError } = await supabase
            .from('settlements')
            .update({ user_id: session.user.id })
            .eq('id', existingSettlement.id)
            .is('user_id', null);
            
          if (updateError) {
            console.error('Error updating settlement user_id:', updateError);
          } else {
            console.log('Updated settlement with user_id:', session.user.id);
          }
        }
        
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
          
          // If a user is logged in but the settlement doesn't have a user_id, update it
          if (session?.user?.id) {
            const { error: updateError } = await supabase
              .from('settlements')
              .update({ user_id: session.user.id })
              .eq('id', existingSettlement.id)
              .is('user_id', null);
              
            if (updateError) {
              console.error('Error updating settlement user_id:', updateError);
            } else {
              console.log('Updated settlement with user_id:', session.user.id);
            }
          }
          
          return { success: true, isExisting: true };
        }
        
        // If there's a user logged in now, update the user_id
        if (session?.user?.id) {
          const { error: updateError } = await supabase
            .from('settlements')
            .update({ user_id: session.user.id })
            .eq('id', existingSettlement.id)
            .is('user_id', null);
            
          if (updateError) {
            console.error('Error updating settlement user_id:', updateError);
          } else {
            console.log('Updated settlement with user_id:', session.user.id);
          }
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
          user_id: session?.user?.id, // Always set user_id if available
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
      
      // First, fetch the settlement to check ownership details
      const { data: settlementData, error: fetchError } = await supabase
        .from('settlements')
        .select('id, user_id, attorney_email, temporary_id')
        .eq('id', settlementId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error fetching settlement:', fetchError);
        throw new Error("Settlement not found");
      }
      
      if (!settlementData) {
        throw new Error("Settlement not found");
      }
      
      console.log("Found settlement:", settlementData);
      
      // Try the direct delete approach first if settlement belongs to user
      if (settlementData.user_id === userId) {
        console.log("Settlement belongs to current user, proceeding with direct deletion");
        
        const { error: deleteError } = await supabase
          .from('settlements')
          .delete()
          .eq('id', settlementId);
          
        if (!deleteError) {
          console.log('Settlement deleted successfully with direct approach');
          return { success: true };
        }
        
        console.error('Direct deletion failed, will try alternative methods:', deleteError);
      }
      
      // Use edge function as a more powerful fallback
      console.log("Calling delete-settlement edge function");
      try {
        const { data: functionResponse, error: functionError } = await supabase.functions.invoke('delete-settlement', {
          body: { 
            settlementId,
            userId,
            email: userEmail,
            temporaryId: settlementData.temporary_id
          }
        });
        
        if (functionError) {
          console.error('Error calling delete-settlement function:', functionError);
          throw new Error("Error calling delete function: " + functionError.message);
        }
        
        console.log('Function response:', functionResponse);
        
        if (functionResponse?.success) {
          console.log('Settlement deleted successfully via function API');
          return { success: true };
        } else {
          console.error('Function API returned error:', functionResponse?.error);
          throw new Error(functionResponse?.error || "Deletion failed via function API");
        }
      } catch (functionCallError) {
        console.error('Exception calling delete-settlement function:', functionCallError);
        throw functionCallError;
      }
    } catch (error: any) {
      console.error('Delete settlement error:', error);
      throw error;
    }
  },
  
  async userOwnsTemporaryId(userId: string, temporaryId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('temporary_id', temporaryId)
        .maybeSingle();
        
      return !!data;
    } catch (error) {
      console.error('Error checking temporary ID ownership:', error);
      return false;
    }
  }
};
