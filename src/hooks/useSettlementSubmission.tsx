import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { settlementService } from "@/services/settlementService";
import { FormData } from "@/types/settlementForm";
import { supabase } from "@/integrations/supabase/client";
import debounce from "lodash.debounce";
import { trackSettlementSubmission } from '@/utils/analytics';

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

  const saveFormData = async () => {
    try {
      console.log("Saving form data with temporaryId:", temporaryId, formData);
      
      const { data: existingRecord, error: checkError } = await supabase
        .from('settlements')
        .select('id, payment_completed')
        .eq('temporary_id', temporaryId)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking existing record:", checkError);
        throw new Error(`Failed to check if settlement exists: ${checkError.message}`);
      }
        
      const submissionData = {
        temporary_id: temporaryId,
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
        payment_completed: false,
        updated_at: new Date().toISOString()
      };
      
      if (existingRecord) {
        console.log("Found existing settlement record, updating:", existingRecord);
        
        if (existingRecord.payment_completed) {
          console.log("Settlement already marked as paid");
          return { success: true, existing: true };
        }
        
        const { data: updatedRecord, error: updateError } = await supabase
          .from('settlements')
          .update(submissionData)
          .eq('id', existingRecord.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating existing settlement:", updateError);
          throw new Error(`Failed to update settlement: ${updateError.message}`);
        }
        
        console.log("Updated existing settlement record:", updatedRecord);
        return { success: true, existing: false, data: updatedRecord };
      } else {
        const newSubmissionData = {
          ...submissionData,
          created_at: new Date().toISOString()
        };
        
        console.log("Inserting new settlement record:", newSubmissionData);
        
        const { data, error } = await supabase
          .from('settlements')
          .insert(newSubmissionData)
          .select()
          .single();
          
        if (error) {
          console.error("Error creating settlement record:", error);
          throw new Error(`Failed to create settlement record: ${error.message}`);
        }
        
        console.log("Successfully created settlement record:", data);
        return { success: true, existing: false, data };
      }
    } catch (error) {
      console.error("Error in saveFormData:", error);
      throw error;
    }
  };

  const createSettlementRecord = async () => {
    try {
      console.log("Creating settlement record with temporaryId:", temporaryId);
      console.log("Form data being submitted:", formData);
      
      if (!formData.amount || !formData.attorneyName || !formData.firmName || !formData.location) {
        throw new Error("Required fields are missing. Please complete all required fields.");
      }
      
      localStorage.setItem('settlement_form_data', JSON.stringify(formData));
      localStorage.setItem('temporary_id', temporaryId);
      console.log("Form data saved to localStorage for recovery");
      
      trackSettlementSubmission({
        settlement_amount: Number(unformatNumber(formData.amount)),
        settlement_type: formData.caseType === 'Other' ? formData.otherCaseType : formData.caseType
      });
      
      return await saveFormData();
    } catch (error) {
      console.error("Error in createSettlementRecord:", error);
      throw error;
    }
  };

  const throttledCreateCheckout = useCallback(
    debounce(async () => {
      if (isProcessingRef.current || checkoutInProgressRef.current) return;
      
      try {
        checkoutInProgressRef.current = true;
        isProcessingRef.current = true;
        
        const settlementResult = await createSettlementRecord();
        console.log("Settlement record creation result:", settlementResult);
        
        if (settlementResult.existing && settlementResult.success) {
          toast({
            title: "Already Submitted",
            description: "This settlement has already been processed. Redirecting to settlements page.",
          });
          navigate('/settlements');
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
        
        try {
          console.log("Calling create-checkout-session edge function");
          const checkoutResponse = await supabase.functions.invoke('create-checkout-session', {
            body: {
              temporaryId,
              userId: userId || undefined,
              returnUrl: window.location.origin + '/confirmation',
              formData: formData
            }
          });
          
          console.log("Checkout session response:", checkoutResponse);
          
          if (checkoutResponse.error) {
            throw new Error(`Error from edge function: ${checkoutResponse.error}`);
          }
          
          const data = checkoutResponse.data;
          
          if (!data) {
            throw new Error('No response data received from server');
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
            if (data.session && data.session.id) {
              localStorage.setItem('payment_session_id', data.session.id);
            }
            
            console.log("Redirecting to Stripe checkout URL:", url);
            window.location.href = url;
          } else {
            throw new Error('No checkout URL received');
          }
        } catch (stripeError) {
          console.error("Stripe checkout creation error:", stripeError);
          
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            
            const waitTime = 2000 * Math.pow(2, retryCountRef.current);
            console.log(`Rate limit detected. Retrying in ${waitTime}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
            
            toast({
              title: "Processing payment",
              description: `Setting up payment gateway (attempt ${retryCountRef.current}/${MAX_RETRIES})...`,
            });
            
            checkoutInProgressRef.current = false;
            
            setTimeout(() => {
              throttledCreateCheckout();
            }, waitTime);
            return;
          }
          
          throw stripeError;
        }
      } catch (error: any) {
        console.error('Error creating checkout session:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to initiate checkout: ${error.message || "Please try again"}`,
        });
        setSubmissionLock(false);
      } finally {
        setIsLoading(false);
        setSubmitting(false);
        isProcessingRef.current = false;
        checkoutInProgressRef.current = false;
      }
    }, 5000, { leading: true, trailing: false }),
    [temporaryId, navigate, toast, setSubmissionLock, setIsLoading, formData]
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
      
      throttledCreateCheckout();
    } catch (error) {
      console.error("Error in handleCreateCheckout:", error);
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
      
      if (result.payment_completed) {
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
        description: `Failed to submit settlement: ${error.message || "Please try again"}`,
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
