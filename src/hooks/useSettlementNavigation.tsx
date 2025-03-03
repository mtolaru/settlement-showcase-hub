import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { FormData, FormErrors } from "@/types/settlementForm";
import { useAuth } from "@/hooks/useAuth";

interface UseSettlementNavigationProps {
  formData: FormData;
  setStep: (step: number) => void;
  setErrors: (errors: FormErrors) => void;
  validateStep1: (formData: FormData) => boolean;
  validateStep2: (formData: FormData, skipEmailValidation: boolean) => boolean;
  verifyEmail: (email: string) => Promise<boolean>;
}

export const useSettlementNavigation = ({
  formData,
  setStep,
  setErrors,
  validateStep1,
  validateStep2,
  verifyEmail
}: UseSettlementNavigationProps) => {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  const handleNextStep = async (): Promise<boolean> => {
    console.log("handleNextStep called for step:", currentStep);
    
    if (currentStep === 1) {
      const validationResult = validateStep1(formData);
      console.log("Step 1 validation result:", validationResult, "Form data:", formData);
      
      if (!validationResult) {
        console.log("Validation failed, staying on step 1");
        return false;
      }
      
      console.log("Moving to step 2");
      setStep(2);
      setCurrentStep(2);
      return true;
    }

    if (currentStep === 2) {
      let validationPassed = false;
      
      if (isAuthenticated && user?.email) {
        validationPassed = validateStep2(formData, true);
        console.log("Step 2 validation (authenticated):", validationPassed);
      } else {
        if (formData.attorneyEmail) {
          const emailExists = await verifyEmail(formData.attorneyEmail);
          if (emailExists) {
            setErrors(prev => ({
              ...prev,
              attorneyEmail: "This email is already associated with settlements. Please log in or use a different email."
            }));
            toast({
              variant: "destructive",
              title: "Email Already Exists",
              description: "Please use a different email or log in to submit another case.",
            });
            return false;
          }
        }
        
        validationPassed = validateStep2(formData, false);
        console.log("Step 2 validation (unauthenticated):", validationPassed);
      }
      
      if (!validationPassed) {
        console.log("Validation failed, staying on step 2");
        return false;
      }
      
      console.log("Moving to step 3");
      setStep(3);
      setCurrentStep(3);
      return true;
    }
    
    return true;
  };

  const handleBackStep = () => {
    console.log("handleBackStep called, moving from step", currentStep, "to", currentStep - 1);
    const newStep = currentStep - 1;
    setStep(newStep);
    setCurrentStep(newStep);
  };

  // Keep track of external step changes
  const updateCurrentStep = (step: number) => {
    if (step !== currentStep) {
      setCurrentStep(step);
    }
  };

  return {
    handleNextStep,
    handleBackStep,
    updateCurrentStep
  };
};
