
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

  useValidateDollarInput(formData, handleInputChange);
  const { handleEmailChange, isValidatingEmail, alreadyExists } = useEmailValidation(formData.attorneyEmail, isValidEmail, setErrors);
  useSubscriptionStatus(setHasActiveSubscription, setIsCheckingSubscription);

  useEffect(() => {
    console.log("Current form errors state:", errors);
  }, [errors]);

  useEffect(() => {
    console.log("Auth state in useSubmitSettlementForm:", { isAuthenticated, user });
    setTemporaryId(crypto.randomUUID());
    
    // Only pre-populate fields if user is actually authenticated
    if (isAuthenticated && user?.email) {
      if (!clearedFields.has('attorneyEmail')) {
        console.log("Setting email from authenticated user:", user.email);
        setFormData(prev => ({
          ...prev,
          attorneyEmail: user.email || ""
        }));
      }
      
      if (settlements && settlements.length > 0) {
        const attorneyInfo = getLatestAttorneyInfo();
        if (attorneyInfo) {
          console.log("Pre-populating attorney name from previous settlement", attorneyInfo);
          
          setFormData(prev => {
            const newFormData = { ...prev };
            
            if (!clearedFields.has('attorneyName') && !newFormData.attorneyName) {
              newFormData.attorneyName = attorneyInfo.attorneyName;
            }
            
            return newFormData;
          });
        }
      }
    } else {
      // User is not authenticated, make sure fields are clearable
      console.log("User not authenticated, ensuring email field is editable");
      if (formData.attorneyEmail && !clearedFields.has('attorneyEmail')) {
        setFormData(prev => ({
          ...prev,
          attorneyEmail: ""
        }));
      }
    }
    
    if (!isLoadingSubscription) {
      const hasActiveSub = !!subscription;
      console.log("Setting hasActiveSubscription based on subscription hook:", hasActiveSub, subscription);
      setHasActiveSubscription(hasActiveSub);
      setIsCheckingSubscription(false);
    }
  }, [isAuthenticated, user, subscription, isLoadingSubscription, setFormData, 
      setHasActiveSubscription, setIsCheckingSubscription, setTemporaryId, 
      getLatestAttorneyInfo, settlements, clearedFields, formData.attorneyEmail]);

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
