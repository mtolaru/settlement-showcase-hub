import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { useSettlementFormState } from './useSettlementFormState';
import { useSettlementNavigation } from './useSettlementNavigation';
import { useSettlementSubmission } from './useSettlementSubmission';
import { useEmailVerification } from './useEmailVerification';
import { FormData, FormErrors } from '@/types/settlementForm';
import { supabase } from "@/integrations/supabase/client";
import { formatNumber, unformatNumber } from '@/utils/currency';
import { 
  trackBeginSubmission,
  trackSubmissionStepComplete
} from '@/utils/analytics';

export const useSubmitSettlementContainer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [emailStatus, setEmailStatus] = useState({ isValidating: false, alreadyExists: false });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    step,
    setStep,
    formData,
    setFormData,
    errors,
    setErrors,
    isCheckingSubscription,
    setIsCheckingSubscription,
    hasActiveSubscription,
    setHasActiveSubscription,
    isLoading,
    setIsLoading,
    isSubmitting,
    setIsSubmitting,
    submissionLock,
    setSubmissionLock,
    temporaryId,
    setTemporaryId,
    handleInputChange,
    handleImageUpload,
    clearFormField,
    clearedFields
  } = useSettlementFormState();

  const { handleVerifyEmail, verifyEmail } = useEmailVerification(setEmailStatus);

  const validateStep1 = (data: FormData): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {};

    if (!data.amount) {
      newErrors.amount = "Settlement amount is required";
      isValid = false;
    }

    if (!data.caseType) {
      newErrors.caseType = "Case Type is required";
      isValid = false;
    }

    if (data.caseType === "Other" && !data.otherCaseType) {
      newErrors.otherCaseType = "Please specify the case type";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateStep2 = (data: FormData, skipEmailValidation: boolean = false): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {};

    if (!data.attorneyName) {
      newErrors.attorneyName = "Attorney name is required";
      isValid = false;
    }

    if (!data.firmName) {
      newErrors.firmName = "Firm name is required";
      isValid = false;
    }

    if (!data.location) {
      newErrors.location = "Location is required";
      isValid = false;
    }

    if (!skipEmailValidation && !data.attorneyEmail) {
      newErrors.attorneyEmail = "Attorney email is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const { handleNextStep, handleBackStep, updateCurrentStep } = useSettlementNavigation({
    formData,
    setStep,
    setErrors,
    validateStep1,
    validateStep2,
    verifyEmail,
    emailStatus
  });

  const { handleSubmitWithSubscription, handleCreateCheckout } = useSettlementSubmission({
    temporaryId: temporaryId!,
    formData,
    setSubmissionLock,
    setIsSubmitting,
    setIsLoading,
    verifyEmail,
    unformatNumber
  });

  useEffect(() => {
    // Track form start when component mounts
    trackBeginSubmission('settlement_details');
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session?.user)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    // Load form state from session storage on component mount
    const storedStep = sessionStorage.getItem('settlementFormStep');
    const storedFormData = sessionStorage.getItem('settlementFormData');

    if (storedStep) {
      setStep(parseInt(storedStep));
    }

    if (storedFormData) {
      setFormData(JSON.parse(storedFormData));
    }

    // Generate a temporary ID if one doesn't exist
    if (!temporaryId) {
      const newTemporaryId = generateTemporaryId();
      setTemporaryId(newTemporaryId);
    }

    // Check for active subscription
    const checkSubscription = async () => {
      setIsCheckingSubscription(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        if (userId) {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', userId)
            .single();

          if (error) {
            console.error("Error fetching subscription:", error);
            setHasActiveSubscription(false);
          } else {
            setHasActiveSubscription(data?.status === 'active');
          }
        } else {
          setHasActiveSubscription(false);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasActiveSubscription(false);
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [setStep, setFormData, setTemporaryId, temporaryId]);

  useEffect(() => {
    updateCurrentStep(step);
  }, [step, updateCurrentStep]);

  const generateTemporaryId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  return {
    step,
    formData,
    errors,
    hasActiveSubscription,
    isLoading,
    isSubmitting,
    isCheckingSubscription,
    handleInputChange,
    handleImageUpload,
    handleNextStep: async () => {
      const success = await handleNextStep();
      if (success) {
        trackSubmissionStepComplete({
          step_number: step,
          step_name: step === 1 ? 'settlement_details' : 'attorney_information'
        });
      }
      return success;
    },
    handleBackStep,
    handleCreateCheckout,
    handleSubmitWithSubscription,
    emailStatus,
    handleVerifyEmail,
    isAuthenticated,
    clearFormField,
    clearedFields
  };
};
