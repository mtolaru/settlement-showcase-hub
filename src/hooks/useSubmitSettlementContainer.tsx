
import { useEffect, useCallback, useMemo } from "react";
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
    clearFormField,
    setErrors,
    setIsLoading,
    setIsSubmitting,
    setSubmissionLock,
    validateStep1,
    validateStep2,
    verifyEmail,
    unformatNumber,
    emailStatus,
    clearedFields
  } = useSubmitSettlementForm();

  // Memoize handlers to prevent recreating on every render
  const { handleSubmitWithSubscription, handleCreateCheckout } = useMemo(() => 
    useSettlementSubmission({
      temporaryId,
      formData,
      setSubmissionLock,
      setIsSubmitting,
      setIsLoading,
      verifyEmail,
      unformatNumber
    }),
  [temporaryId, formData, setSubmissionLock, setIsSubmitting, setIsLoading, verifyEmail, unformatNumber]);

  // Memoize navigation handlers
  const { handleNextStep, handleBackStep, updateCurrentStep } = useMemo(() => 
    useSettlementNavigation({
      formData,
      setStep,
      setErrors,
      validateStep1,
      validateStep2,
      verifyEmail,
      emailStatus
    }),
  [formData, setStep, setErrors, validateStep1, validateStep2, verifyEmail, emailStatus]);

  // Update the navigation step whenever the form step changes - with proper dependency array
  useEffect(() => {
    updateCurrentStep(step);
  }, [step, updateCurrentStep]);

  // Memoize subscription status logging to prevent cyclic dependencies - only log when values change
  useEffect(() => {
    // Only log when these values change to reduce noise
    console.log("SubmitSettlement component - Current subscription status:", {
      isAuthenticated,
      userId: user?.id,
      hasActiveSubscription,
      isCheckingSubscription,
      hasActiveSubscriptionType: typeof hasActiveSubscription
    });
  }, [isAuthenticated, user?.id, hasActiveSubscription, isCheckingSubscription]);

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
    clearFormField,
    handleNextStep,
    handleBackStep,
    handleCreateCheckout,
    handleSubmitWithSubscription,
    emailStatus,
    isAuthenticated,
    clearedFields
  };
};
