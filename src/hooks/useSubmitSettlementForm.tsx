
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettlementForm } from "@/hooks/useSettlementForm";
import { useSubscription } from "@/hooks/useSubscription";
import { verifyEmail } from "@/utils/emailUtils";
import { useSettlementFormState } from "@/hooks/useSettlementFormState";

export const useSubmitSettlementForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    step, setStep,
    formData, setFormData,
    errors, setErrors,
    isCheckingSubscription, setIsCheckingSubscription,
    hasActiveSubscription, setHasActiveSubscription,
    isLoading, setIsLoading,
    isSubmitting, setIsSubmitting,
    submissionLock, setSubmissionLock,
    temporaryId, setTemporaryId,
    handleInputChange, handleImageUpload
  } = useSettlementFormState();
  
  const { validateStep1, validateStep2, unformatNumber, isValidEmail } = useSettlementForm();
  const { user, isAuthenticated } = useAuth();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription(user);

  // Debug log - always show current errors
  useEffect(() => {
    console.log("Current form errors state:", errors);
  }, [errors]);

  // Validate numeric input for dollar fields
  const validateDollarInput = (value: string, field: string) => {
    if (value) {
      const numericValue = value.replace(/[^0-9,.]/g, '');
      if (numericValue !== value) {
        handleInputChange(field, numericValue);
      }
    }
  };

  // Add real-time validation for dollar fields
  useEffect(() => {
    validateDollarInput(formData.amount, 'amount');
    validateDollarInput(formData.initialOffer, 'initialOffer');
    validateDollarInput(formData.policyLimit, 'policyLimit');
    validateDollarInput(formData.medicalExpenses, 'medicalExpenses');
  }, [formData.amount, formData.initialOffer, formData.policyLimit, formData.medicalExpenses]);

  // Add real-time validation for email
  useEffect(() => {
    if (formData.attorneyEmail && !isValidEmail(formData.attorneyEmail)) {
      setErrors(prev => ({
        ...prev,
        attorneyEmail: "Please enter a valid email address"
      }));
    } else if (formData.attorneyEmail) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.attorneyEmail === "Please enter a valid email address") {
          delete newErrors.attorneyEmail;
        }
        return newErrors;
      });
    }
  }, [formData.attorneyEmail]);

  useEffect(() => {
    setTemporaryId(crypto.randomUUID());
    
    if (isAuthenticated && user?.email) {
      setFormData(prev => ({
        ...prev,
        attorneyEmail: user.email || ""
      }));
    }
    
    if (!isLoadingSubscription) {
      const hasActiveSub = !!subscription;
      console.log("Setting hasActiveSubscription based on subscription hook:", hasActiveSub, subscription);
      setHasActiveSubscription(hasActiveSub);
      setIsCheckingSubscription(false);
    }
  }, [isAuthenticated, user, subscription, isLoadingSubscription, setFormData, setHasActiveSubscription, setIsCheckingSubscription, setTemporaryId]);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("Checking subscription status for user:", session.user.id);
        
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gt('ends_at', new Date().toISOString())
          .maybeSingle();

        if (error) {
          console.error('Error checking subscription:', error);
          throw error;
        }
        
        console.log("Subscription query result:", subscriptions);
        
        const hasActiveSub = !!subscriptions;
        console.log("Setting hasActiveSubscription to:", hasActiveSub);
        
        setHasActiveSubscription(hasActiveSub);
        
        if (!hasActiveSub) {
          const { data: openSubscriptions, error: openError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .is('ends_at', null)
            .maybeSingle();
            
          if (openError) {
            console.error('Error checking open-ended subscription:', openError);
          } else {
            console.log("Open-ended subscription check result:", openSubscriptions);
            if (openSubscriptions) {
              console.log("Found open-ended subscription, setting hasActiveSubscription to true");
              setHasActiveSubscription(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify subscription status. Please try again.",
      });
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const handleEmailChange = async (email: string) => {
    if (email && !(isAuthenticated && user?.email === email)) {
      // First validate email format before checking if it exists
      if (!isValidEmail(email)) {
        setErrors(prev => ({
          ...prev,
          attorneyEmail: "Please enter a valid email address"
        }));
        return;
      }

      const emailExists = await verifyEmail(email, user?.email);
      if (emailExists) {
        setErrors(prev => ({
          ...prev,
          attorneyEmail: "This email is already associated with settlements. Please log in or use a different email."
        }));
      }
    }
  };

  useEffect(() => {
    if (formData.attorneyEmail) {
      handleEmailChange(formData.attorneyEmail);
    }
  }, [formData.attorneyEmail]);

  return {
    step,
    setStep,
    formData,
    errors,
    isCheckingSubscription: isCheckingSubscription || isLoadingSubscription,
    hasActiveSubscription,
    isLoading,
    isSubmitting,
    submissionLock,
    temporaryId,
    handleInputChange,
    handleImageUpload,
    setErrors,
    setIsLoading,
    setIsSubmitting,
    setSubmissionLock,
    validateStep1,
    validateStep2,
    verifyEmail: (email: string) => verifyEmail(email, user?.email),
    unformatNumber,
    checkSubscriptionStatus
  };
};
