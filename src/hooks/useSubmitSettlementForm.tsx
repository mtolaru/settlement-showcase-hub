
import { useEffect, useCallback, useMemo, useRef } from "react";
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
  const initialRenderRef = useRef(true);
  const emailCheckedRef = useRef(false);
  const subscriptionCheckedRef = useRef(false);
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

  // Validate dollar inputs only when formData changes and after initial render
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    useValidateDollarInput(formData, handleInputChange);
  }, [formData, handleInputChange]);

  // Memoize subscription status checking with proper dependencies
  const { checkSubscriptionStatus } = useSubscriptionStatus(
    setHasActiveSubscription, 
    setIsCheckingSubscription
  );

  // Pre-populate user data only when auth state changes
  useEffect(() => {
    if (isAuthenticated && user?.email && !clearedFields.has('attorneyEmail') && !emailCheckedRef.current) {
      emailCheckedRef.current = true;
      console.log("Pre-populating email from authenticated user:", user.email);
      setFormData(prev => ({
        ...prev,
        attorneyEmail: prev.attorneyEmail || user.email || ""
      }));
    }
  }, [isAuthenticated, user?.email, clearedFields, setFormData]);

  // Separate effect for populating attorney info from previous settlements
  useEffect(() => {
    if (isAuthenticated && settlements && settlements.length > 0 && !formData.attorneyName && !clearedFields.has('attorneyName')) {
      const attorneyInfo = getLatestAttorneyInfo();
      if (attorneyInfo) {
        console.log("Pre-populating attorney name from previous settlement", attorneyInfo);
        
        setFormData(prev => ({
          ...prev,
          attorneyName: attorneyInfo.attorneyName || prev.attorneyName
        }));
      }
    }
  }, [isAuthenticated, settlements, getLatestAttorneyInfo, formData.attorneyName, setFormData, clearedFields]);

  // Handle subscription status only when subscription changes
  useEffect(() => {
    if (!isLoadingSubscription && subscription !== undefined && !subscriptionCheckedRef.current) {
      subscriptionCheckedRef.current = true;
      const hasActiveSub = !!subscription;
      console.log("Setting hasActiveSubscription based on subscription hook:", hasActiveSub, subscription);
      setHasActiveSubscription(hasActiveSub);
      setIsCheckingSubscription(false);
    }
  }, [subscription, isLoadingSubscription, setHasActiveSubscription, setIsCheckingSubscription]);

  // Clear email validation errors for authenticated users
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

  // Log errors only when they change
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

  // Memoize authentication and user data updates - only log once
  useEffect(() => {
    console.log("Auth state in useSubmitSettlementForm:", { isAuthenticated, user });
  }, [isAuthenticated, user]);

  // Email validation state - memoized to prevent unnecessary recalculations
  const { isValidatingEmail, alreadyExists } = useEmailValidation(
    formData.attorneyEmail, 
    isValidEmail, 
    setErrors
  );

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
    checkSubscriptionStatus,
    emailStatus: {
      isValidating: isValidatingEmail,
      alreadyExists
    },
    isAuthenticated,
    clearedFields
  };
};
