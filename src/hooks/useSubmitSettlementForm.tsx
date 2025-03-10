
import { useEffect, useCallback, useMemo } from "react";
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
import { useSettlements } from "@/hooks/useSettlements";

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
    handleInputChange, handleImageUpload,
    clearFormField, clearedFields
  } = useSettlementFormState();
  
  const { validateStep1, validateStep2, unformatNumber, isValidEmail } = useSettlementForm();
  const { user, isAuthenticated } = useAuth();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription(user);
  const { settlements, getLatestAttorneyInfo } = useSettlements(user);

  // Only validate dollar inputs when formData changes
  useValidateDollarInput(formData, handleInputChange);
  
  // Email validation state
  const { isValidatingEmail, alreadyExists } = useEmailValidation(formData.attorneyEmail, isValidEmail, setErrors);
  
  // Use the hook with its own dependency array - only subscribe to changes
  useSubscriptionStatus(setHasActiveSubscription, setIsCheckingSubscription);

  // Add dependency array for error logging - only log when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Current form errors state:", errors);
    }
  }, [errors]);

  // Generate temporaryId once on component mount
  useEffect(() => {
    if (!temporaryId) {
      setTemporaryId(crypto.randomUUID());
    }
  }, [temporaryId, setTemporaryId]);

  // Memoize authentication and user data updates - only run when dependencies change
  useEffect(() => {
    console.log("Auth state in useSubmitSettlementForm:", { isAuthenticated, user });
    
    // Only pre-populate fields if user is actually authenticated and we have values
    if (isAuthenticated && user?.email && !clearedFields.has('attorneyEmail')) {
      console.log("Setting email from authenticated user:", user.email);
      setFormData(prev => ({
        ...prev,
        attorneyEmail: prev.attorneyEmail || user.email || ""
      }));
    }
  }, [isAuthenticated, user, setFormData, clearedFields]);

  // Separate effect for populating attorney info from previous settlements
  useEffect(() => {
    if (isAuthenticated && settlements && settlements.length > 0) {
      const attorneyInfo = getLatestAttorneyInfo();
      if (attorneyInfo && !clearedFields.has('attorneyName') && !formData.attorneyName) {
        console.log("Pre-populating attorney name from previous settlement", attorneyInfo);
        
        setFormData(prev => ({
          ...prev,
          attorneyName: attorneyInfo.attorneyName || prev.attorneyName
        }));
      }
    }
  }, [isAuthenticated, settlements, getLatestAttorneyInfo, formData.attorneyName, setFormData, clearedFields]);

  // Separate effect for subscription status
  useEffect(() => {
    if (!isLoadingSubscription && subscription !== undefined) {
      const hasActiveSub = !!subscription;
      console.log("Setting hasActiveSubscription based on subscription hook:", hasActiveSub, subscription);
      setHasActiveSubscription(hasActiveSub);
      setIsCheckingSubscription(false);
    }
  }, [subscription, isLoadingSubscription, setHasActiveSubscription, setIsCheckingSubscription]);

  // Separate effect for email validation handling
  useEffect(() => {
    if (isAuthenticated && user?.email === formData.attorneyEmail && errors.attorneyEmail) {
      console.log("Clearing email error for authenticated user using their own email");
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.attorneyEmail;
        return newErrors;
      });
    }
  }, [formData.attorneyEmail, isAuthenticated, user?.email, errors.attorneyEmail, setErrors]);

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
    clearFormField,
    setErrors,
    setIsLoading,
    setIsSubmitting,
    setSubmissionLock,
    validateStep1,
    validateStep2,
    verifyEmail: (email: string) => verifyEmail(email, user?.email),
    unformatNumber,
    checkSubscriptionStatus: null,
    emailStatus: {
      isValidating: isValidatingEmail,
      alreadyExists
    },
    isAuthenticated,
    clearedFields
  };
};
