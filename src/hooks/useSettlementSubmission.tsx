
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { settlementService } from "@/services/settlementService";
import { FormData } from "@/types/settlementForm";
import { supabase } from "@/integrations/supabase/client";
import debounce from "lodash.debounce";

interface UseSettlementSubmissionProps {
  temporaryId: string;
  formData: FormData;
  setSubmissionLock: (locked: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  verifyEmail: (email: string) => Promise<boolean>;
  unformatNumber: (value: string) => string;
}

export const useSettlementSubmission = ({
  temporaryId,
  formData,
  setSubmissionLock,
  setIsSubmitting,
  setIsLoading,
  verifyEmail,
  unformatNumber
}: UseSettlementSubmissionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const isProcessingRef = useRef(false);
  const retryCountRef = useRef(0);
  const checkoutInProgressRef = useRef(false);
  const MAX_RETRIES = 3;

  // Create settlement record first
  const createSettlementRecord = async () => {
    try {
      console.log("Creating settlement record with temporaryId:", temporaryId);
      console.log("Form data being submitted:", formData);
      
      // First check if a record already exists
      const { data: existingRecord } = await supabase
        .from('settlements')
        .select('id, payment_completed')
        .eq('temporary_id', temporaryId)
        .maybeSingle();
        
      if (existingRecord) {
        console.log("Found existing settlement record:", existingRecord);
        
        if (existingRecord.payment_completed) {
          console.log("Settlement already marked as paid");
          toast({
            title: "Already Submitted",
            description: "This settlement has already been processed."
          });
          navigate('/confirmation?temporaryId=' + temporaryId);
          return { success: true, existing: true };
        }
        
        // Update existing record with current form data
        const { data: updatedRecord, error: updateError } = await supabase
          .from('settlements')
          .update({
            amount: Number(unformatNumber(formData.amount)) || 0,
            attorney: formData.attorneyName || '',
            firm: formData.firmName || '',
            firm_website: formData.firmWebsite || '',
            location: formData.location || '',
            type: formData.caseType === "Other" ? formData.otherCaseType || 'Other' : formData.caseType || 'Other',
            description: formData.caseDescription || '',
            case_description: formData.caseDescription || '',
            initial_offer: formData.initialOffer ? Number(unformatNumber(formData.initialOffer)) : null,
            policy_limit: formData.policyLimit ? Number(unformatNumber(formData.policyLimit)) : null,
            medical_expenses: formData.medicalExpenses ? Number(unformatNumber(formData.medicalExpenses)) : null,
            settlement_phase: formData.settlementPhase || '',
            settlement_date: formData.settlementDate || null,
            photo_url: formData.photoUrl || '',
            attorney_email: formData.attorneyEmail || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating existing settlement:", updateError);
          throw updateError;
        }
        
        console.log("Updated existing settlement record:", updatedRecord);
        
        // Save form data to localStorage for recovery
        localStorage.setItem('settlement_form_data', JSON.stringify(formData));
        localStorage.setItem('temporary_id', temporaryId);
        console.log("Form data saved to localStorage for recovery");
        
        return { success: true, existing: false, data: updatedRecord };
      }
      
      // Create new settlement record with all form data
      const submissionData = {
        amount: Number(unformatNumber(formData.amount)) || 0,
        attorney: formData.attorneyName || '',
        firm: formData.firmName || '',
        firm_website: formData.firmWebsite || '',
        location: formData.location || '',
        type: formData.caseType === "Other" ? formData.otherCaseType || 'Other' : formData.caseType || 'Other',
        description: formData.caseDescription || '',
        case_description: formData.caseDescription || '',
        initial_offer: formData.initialOffer ? Number(unformatNumber(formData.initialOffer)) : null,
        policy_limit: formData.policyLimit ? Number(unformatNumber(formData.policyLimit)) : null,
        medical_expenses: formData.medicalExpenses ? Number(unformatNumber(formData.medicalExpenses)) : null,
        settlement_phase: formData.settlementPhase || '',
        settlement_date: formData.settlementDate || null,
        photo_url: formData.photoUrl || '',
        temporary_id: temporaryId,
        attorney_email: formData.attorneyEmail || '',
        payment_completed: false,
        created_at: new Date().toISOString()
      };
      
      console.log("Inserting new settlement record:", submissionData);
      
      const { data, error } = await supabase
        .from('settlements')
        .insert(submissionData)
        .select()
        .single();
        
      if (error) {
        console.error("Error creating settlement record:", error);
        throw error;
      }
      
      console.log("Successfully created settlement record:", data);
      
      // Save form data to localStorage for recovery
      localStorage.setItem('settlement_form_data', JSON.stringify(formData));
      localStorage.setItem('temporary_id', temporaryId);
      console.log("Form data saved to localStorage for recovery");
      
      return { success: true, existing: false, data };
    } catch (error) {
      console.error("Error in createSettlementRecord:", error);
      throw error;
    }
  };

  // NEW: Create a throttled checkout session creator that runs at most once every 5 seconds
  const throttledCreateCheckout = useCallback(
    debounce(async () => {
      if (isProcessingRef.current || checkoutInProgressRef.current) return;
      
      try {
        checkoutInProgressRef.current = true;
        isProcessingRef.current = true;
        
        // First save the settlement data
        const settlementResult = await createSettlementRecord();
        console.log("Settlement record creation result:", settlementResult);
        
        // If already paid, we're done
        if (settlementResult.existing && settlementResult.success) {
          isProcessingRef.current = false;
          checkoutInProgressRef.current = false;
          setIsLoading(false);
          setSubmitting(false);
          return;
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        console.log("Creating checkout session with data:", {
          temporaryId,
          userId: userId || "undefined"
        });
        
        // Try to create checkout session
        let checkoutResponse;
        try {
          checkoutResponse = await supabase.functions.invoke('create-checkout-session', {
            body: {
              temporaryId,
              userId: userId || undefined,
              returnUrl: window.location.origin + '/confirmation',
              formData: null
            }
          });
        } catch (stripeError) {
          console.error("Stripe checkout creation error:", stripeError);
          
          // If we get a rate limit error, wait and retry
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            
            const waitTime = 2000 * Math.pow(2, retryCountRef.current);
            console.log(`Rate limit detected. Retrying in ${waitTime}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
            
            toast({
              title: "Processing payment",
              description: `Setting up payment gateway (attempt ${retryCountRef.current}/${MAX_RETRIES})...`,
            });
            
            // Reset in-progress flag but keep processing flag
            checkoutInProgressRef.current = false;
            
            // Wait and retry
            setTimeout(() => {
              throttledCreateCheckout();
            }, waitTime);
            return;
          }
          
          throw stripeError;
        }
        
        console.log("Checkout session response:", checkoutResponse);
        
        const data = checkoutResponse.data;
        
        if (!data) {
          throw new Error('No response received from server');
        }
        
        if (data.error) {
          console.error("Error creating checkout session:", data.error);
          throw new Error(data.error);
        }
        
        if (data.isExisting) {
          toast({
            title: "Already Submitted",
            description: "This settlement has already been processed. Redirecting to settlements page.",
          });
          navigate('/settlements');
          return;
        }
        
        const { url } = data;
        if (url) {
          // Store session info in localStorage for recovery
          if (data.session && data.session.id) {
            localStorage.setItem('payment_session_id', data.session.id);
          }
          
          // Navigate to Stripe checkout
          window.location.href = url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (error: any) {
        console.error('Error creating checkout session:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initiate checkout. Please try again.",
        });
        setSubmissionLock(false);
      } finally {
        setIsLoading(false);
        setSubmitting(false);
        isProcessingRef.current = false;
        checkoutInProgressRef.current = false;
      }
    }, 5000, { leading: true, trailing: false }),
    [temporaryId, navigate, toast, setSubmissionLock, setIsLoading]
  );

  const handleCreateCheckout = async () => {
    if (submitting || isProcessingRef.current || checkoutInProgressRef.current) {
      console.log("Checkout already in progress, ignoring duplicate request");
      return;
    }
    
    setSubmitting(true);
    setSubmissionLock(true);
    setIsLoading(true);
    retryCountRef.current = 0;
    
    try {
      if (formData.attorneyEmail) {
        const emailExists = await verifyEmail(formData.attorneyEmail);
        if (emailExists) {
          toast({
            variant: "destructive",
            title: "Email Already Exists",
            description: "This email is already associated with settlements. Please log in or use a different email.",
          });
          setIsLoading(false);
          setSubmissionLock(false);
          setSubmitting(false);
          return;
        }
      }
      
      // Launch the throttled checkout creator
      throttledCreateCheckout();
      
    } catch (error) {
      setIsLoading(false);
      setSubmissionLock(false);
      setSubmitting(false);
    }
  };

  const handleSubmitWithSubscription = async () => {
    if (submitting || isProcessingRef.current) return;
    setSubmitting(true);
    setSubmissionLock(true);
    setIsSubmitting(true);
    isProcessingRef.current = true;
    
    try {
      const result = await settlementService.submitWithSubscription(
        temporaryId, 
        formData, 
        unformatNumber
      );
      
      if (result.isExisting) {
        toast({
          title: "Already Submitted",
          description: "This settlement has already been processed. Redirecting to settlements page.",
        });
      } else {
        toast({
          title: "Success",
          description: "Your settlement has been submitted successfully.",
        });
      }
      
      navigate('/settlements');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit settlement. Please try again.",
      });
      setSubmissionLock(false);
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      throttledCreateCheckout.cancel();
    };
  }, [throttledCreateCheckout]);

  return {
    handleSubmitWithSubscription,
    handleCreateCheckout
  };
};
