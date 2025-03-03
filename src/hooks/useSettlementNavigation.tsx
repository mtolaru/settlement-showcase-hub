
import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FormData, FormErrors } from "@/types/settlementForm";

interface UseSettlementNavigationProps {
  formData: FormData;
  setStep: (step: number) => void;
  setErrors: (errors: FormErrors) => void;
  validateStep1: (formData: FormData) => boolean;
  validateStep2: (formData: FormData, skipEmailValidation?: boolean) => boolean;
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
  const navigate = useNavigate();
  const location = useLocation();

  // Save form state to session storage
  const saveFormState = useCallback(() => {
    sessionStorage.setItem('settlementFormData', JSON.stringify(formData));
  }, [formData]);

  // Update current step based on navigation
  const updateCurrentStep = useCallback((step: number) => {
    sessionStorage.setItem('settlementFormStep', step.toString());
  }, []);

  // Handle moving to next step
  const handleNextStep = async () => {
    console.log("handleNextStep called for step:", sessionStorage.getItem('settlementFormStep') || "1");
    
    const currentStep = parseInt(sessionStorage.getItem('settlementFormStep') || "1");
    
    if (currentStep === 1) {
      console.log("Running validateStep1 with data:", formData);
      const isValid = validateStep1(formData);
      console.log("Step 1 validation result:", isValid, "Form data:", formData);
      
      if (isValid) {
        console.log("Moving to step 2");
        saveFormState();
        setStep(2);
      } else {
        console.log("Step 1 validation failed");
      }
    } 
    else if (currentStep === 2) {
      const isValid = validateStep2(formData);
      
      if (isValid) {
        saveFormState();
        setStep(3);
      }
    }
  };

  // Handle moving back to previous step
  const handleBackStep = () => {
    console.log("handleBackStep called, moving from step", 
      sessionStorage.getItem('settlementFormStep') || "unknown", "to", 
      (parseInt(sessionStorage.getItem('settlementFormStep') || "2") - 1));
    
    const currentStep = parseInt(sessionStorage.getItem('settlementFormStep') || "2");
    
    if (currentStep > 1) {
      saveFormState();
      setStep(currentStep - 1);
    } else {
      // If on first step and go back, confirm before navigating away
      if (window.confirm("Are you sure you want to leave? Your form data will be lost.")) {
        navigate("/");
      }
    }
  };

  return {
    handleNextStep,
    handleBackStep,
    updateCurrentStep
  };
};
