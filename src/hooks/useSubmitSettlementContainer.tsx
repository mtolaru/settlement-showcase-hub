
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useSubmitSettlementForm } from "@/hooks/useSubmitSettlementForm";
import { useAuth } from "@/hooks/useAuth";
import { useSettlementSubmission } from "@/hooks/useSettlementSubmission";
import { useSettlementNavigation } from "@/hooks/useSettlementNavigation";

export const useSubmitSettlementContainer = () => {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const {
    step,
    setStep,
    formData,
    errors,
    isCheckingSubscription,
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
    verifyEmail,
    unformatNumber,
    checkSubscriptionStatus
  } = useSubmitSettlementForm();

  const { handleSubmitWithSubscription, handleCreateCheckout } = useSettlementSubmission({
    temporaryId,
    formData,
    setSubmissionLock,
    setIsSubmitting,
    setIsLoading,
    verifyEmail,
    unformatNumber
  });

  const { handleNextStep, handleBackStep, updateCurrentStep } = useSettlementNavigation({
    formData,
    setStep,
    setErrors,
    validateStep1,
    validateStep2,
    verifyEmail
  });

  // Update the navigation step whenever the form step changes
  useEffect(() => {
    updateCurrentStep(step);
  }, [step, updateCurrentStep]);

  useEffect(() => {
    console.log("SubmitSettlement component - Current subscription status:", {
      isAuthenticated,
      userId: user?.id,
      hasActiveSubscription,
      isCheckingSubscription,
      hasActiveSubscriptionType: typeof hasActiveSubscription
    });
  }, [isAuthenticated, user, hasActiveSubscription, isCheckingSubscription]);

  return {
    step,
    formData,
    errors,
    isCheckingSubscription,
    hasActiveSubscription,
    isLoading,
    isSubmitting,
    handleInputChange,
    handleImageUpload,
    handleNextStep,
    handleBackStep,
    handleCreateCheckout,
    handleSubmitWithSubscription
  };
};
