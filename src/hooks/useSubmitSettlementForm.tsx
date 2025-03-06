
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSettlementForm } from "@/hooks/useSettlementForm";
import { useSubscription } from "@/hooks/useSubscription";
import { verifyEmail } from "@/utils/emailUtils";
import { useSettlementFormState } from "@/hooks/useSettlementFormState";
import { useValidateDollarInput } from "@/hooks/useValidateDollarInput";
import { useEmailValidation } from "@/hooks/useEmailValidation";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

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

  // Use our hooks
  useValidateDollarInput(formData, handleInputChange);
  const { handleEmailChange, isValidatingEmail, alreadyExists } = useEmailValidation(formData.attorneyEmail, isValidEmail, setErrors);
  useSubscriptionStatus(setHasActiveSubscription, setIsCheckingSubscription);

  // Debug log - always show current errors
  useEffect(() => {
    console.log("Current form errors state:", errors);
  }, [errors]);

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
    checkSubscriptionStatus: null, // This is now handled by useSubscriptionStatus
    emailStatus: {
      isValidating: isValidatingEmail,
      alreadyExists
    }
  };
};
