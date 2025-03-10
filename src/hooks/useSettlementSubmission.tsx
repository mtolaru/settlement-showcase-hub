
import { useState, useCallback, useRef } from "react";
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

  const debouncedCreateCheckout = useCallback(
    debounce(async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        console.log("Creating checkout session with data:", {
          temporaryId,
          userId: userId || "undefined",
          formData: { ...formData, email: formData.attorneyEmail }
        });
        
        const response = await supabase.functions.invoke('create-checkout-session', {
          body: {
            temporaryId,
            userId: userId || undefined,
            returnUrl: window.location.origin + '/confirmation',
            formData
          }
        });
        
        console.log("Checkout session response:", response);
        
        const data = response.data;
        
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

  // Clean up on unmount
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
