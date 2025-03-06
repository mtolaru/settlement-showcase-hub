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
      
      // First try to claim the settlement if needed
      if (!settlementData.user_id || settlementData.user_id !== userId) {
        // Try to claim by email match
        if (settlementData.attorney_email && userEmail && settlementData.attorney_email === userEmail) {
          console.log("Attempting to claim settlement by email match");
          
          const { error: updateError } = await supabase
            .from('settlements')
            .update({ user_id: userId })
            .eq('id', settlementId);
            
          if (updateError) {
            console.error("Error claiming settlement by email:", updateError);
          } else {
            console.log("Successfully claimed settlement by email match");
          }
        }
        
        // Try to claim by temporary_id
        if (settlementData.temporary_id) {
          console.log(`Attempting to claim settlement with temporary_id ${settlementData.temporary_id}`);
          
          // Check if this user has a subscription with the same temporary_id
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('temporary_id', settlementData.temporary_id)
            .eq('user_id', userId)
            .maybeSingle();
            
          if (subscriptionData) {
            console.log("Found matching subscription with same temporary_id, claiming settlement");
            
            const { error: updateError } = await supabase
              .from('settlements')
              .update({ user_id: userId })
              .eq('id', settlementId);
              
            if (updateError) {
              console.error("Error claiming settlement by temporary_id:", updateError);
            } else {
              console.log("Successfully claimed settlement by temporary_id match");
            }
          }
        }
      }
      
      // After claiming attempts, fetch the settlement again to get updated user_id
      const { data: updatedSettlement } = await supabase
        .from('settlements')
        .select('user_id')
        .eq('id', settlementId)
        .maybeSingle();
        
      if (updatedSettlement && updatedSettlement.user_id === userId) {
        console.log("Settlement now belongs to current user, proceeding with deletion");
        
        const { data: deleteData, error: deleteError } = await supabase
          .from('settlements')
          .delete()
          .eq('id', settlementId);
          
        if (deleteError) {
          console.error('Error deleting settlement:', deleteError);
          throw new Error("Error deleting settlement: " + deleteError.message);
        }
        
        console.log('Settlement deleted successfully');
        return { success: true, data: deleteData };
      }
      
      // If still not owned by user, try deletion with various methods
      
      // 1. Try to delete by user_id (most secure)
      const { data: deleteByUserIdData, error: deleteByUserIdError } = await supabase
        .from('settlements')
        .delete()
        .eq('id', settlementId)
        .eq('user_id', userId);
        
      if (!deleteByUserIdError && deleteByUserIdData !== null) {
        console.log('Settlement deleted successfully by user ID');
        return { success: true, data: deleteByUserIdData };
      }
      
      if (deleteByUserIdError) {
        console.error('Error deleting settlement by user ID:', deleteByUserIdError);
      } else {
        console.log("No settlement found to delete by user ID, trying alternative methods");
      }
      
      // 2. Try by email match
      if (userEmail) {
        const { data: deleteByEmailData, error: deleteByEmailError } = await supabase
          .from('settlements')
          .delete()
          .eq('id', settlementId)
          .eq('attorney_email', userEmail);
          
        if (!deleteByEmailError && deleteByEmailData !== null) {
          console.log('Settlement deleted successfully by attorney email');
          return { success: true, data: deleteByEmailData };
        }
        
        if (deleteByEmailError) {
          console.error('Error deleting settlement by email:', deleteByEmailError);
        } else {
          console.log("No settlement found to delete by email, trying final method");
        }
      }
      
      // 3. Last resort - try a direct delete if the settlement exists and email matches or temporary_id matches
      if ((userEmail && settlementData.attorney_email === userEmail) || 
          (settlementData.temporary_id && await this.userOwnsTemporaryId(userId, settlementData.temporary_id))) {
        
        console.log("Attempting direct delete as last resort");
        const { data: directDeleteData, error: directDeleteError } = await supabase
          .from('settlements')
          .delete()
          .eq('id', settlementId);
          
        if (!directDeleteError && directDeleteData !== null) {
          console.log('Settlement deleted successfully via direct delete');
          return { success: true, data: directDeleteData };
        }
        
        if (directDeleteError) {
          console.error('Error with direct delete:', directDeleteError);
        }
      }
      
      // If we got here, the settlement couldn't be deleted
      throw new Error("Could not delete settlement. You may not have permission or the settlement may have been deleted already.");
    } catch (error: any) {
      console.error('Delete settlement error:', error);
      throw error;
    }
  },
  
  // Helper method to check if a user owns a temporary ID via subscription
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
