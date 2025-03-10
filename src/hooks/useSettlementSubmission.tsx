
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
  const MAX_RETRIES = 3;

  // Save settlement data first before redirecting to checkout
  const createSettlementRecord = async () => {
    try {
      console.log("Creating settlement record with temporaryId:", temporaryId);
      
      // First check if a record already exists
      const { data: existingRecord } = await supabase
        .from('settlements')
        .select('id, payment_completed')
        .eq('temporary_id', temporaryId)
        .maybeSingle();
        
      if (existingRecord) {
        console.log("Found existing settlement record:", existingRecord);
        
        if (existingRecord.payment_completed) {
          console.log("Settlement already marked as paid, redirecting to confirmation");
          toast({
            title: "Already Submitted",
            description: "This settlement has already been processed."
          });
          navigate('/confirmation?temporaryId=' + temporaryId);
          return { success: true, existing: true };
        }
        
        return { success: true, existing: false };
      }
      
      // Create new settlement record
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
        temporary_id: temporaryId,
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
      localStorage.setItem('temporary_id', temporaryId);
      return { success: true, existing: false, data };
    } catch (error) {
      console.error("Error in createSettlementRecord:", error);
      throw error;
    }
  };

  const debouncedCreateCheckout = useCallback(
    debounce(async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      
      try {
        // First save the settlement data
        const settlementResult = await createSettlementRecord();
        console.log("Settlement record creation result:", settlementResult);
        
        // If already paid, we're done
        if (settlementResult.existing && settlementResult.success) {
          isProcessingRef.current = false;
          setIsLoading(false);
          setSubmitting(false);
          return;
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        console.log("Creating checkout session with data:", {
          temporaryId,
          userId: userId || "undefined",
          formData: { ...formData, email: formData.attorneyEmail }
        });
        
        // Try to create checkout session
        let checkoutResponse;
        try {
          checkoutResponse = await supabase.functions.invoke('create-checkout-session', {
            body: {
              temporaryId,
              userId: userId || undefined,
              returnUrl: window.location.origin + '/confirmation',
              formData
            }
          });
        } catch (stripeError) {
          console.error("Stripe checkout creation error:", stripeError);
          
          // If we get a rate limit error, wait and retry
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            
            const waitTime = 2000 * retryCountRef.current; // Exponential backoff
            console.log(`Rate limit detected. Retrying in ${waitTime}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
            
            toast({
              title: "Processing payment",
              description: `Setting up payment gateway (attempt ${retryCountRef.current}/${MAX_RETRIES})...`,
            });
            
            // Wait and retry
            setTimeout(() => {
              isProcessingRef.current = false;
              debouncedCreateCheckout();
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
      }
    }, 1000),
    [temporaryId, formData, navigate, toast, setSubmissionLock, setIsLoading]
  );

  const handleCreateCheckout = async () => {
    if (submitting || isProcessingRef.current) return;
    
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
      
      // First create the settlement record
      try {
        await createSettlementRecord();
      } catch (createError) {
        console.error("Failed to create settlement record:", createError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save settlement data. Please try again.",
        });
        setIsLoading(false);
        setSubmissionLock(false);
        setSubmitting(false);
        return;
      }
      
      // Then proceed with checkout
      debouncedCreateCheckout();
      
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
      debouncedCreateCheckout.cancel();
    };
  }, [debouncedCreateCheckout]);

  return {
    handleSubmitWithSubscription,
    handleCreateCheckout
  };
};
