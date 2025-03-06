
import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FormData, FormErrors } from "@/types/settlementForm";

interface UseSettlementNavigationProps {
  formData: FormData;
  setStep: (step: number) => void;
  setErrors: (errors: FormErrors | ((prev: FormErrors) => FormErrors)) => void;
  validateStep1: (formData: FormData) => boolean;
  validateStep2: (formData: FormData, skipEmailValidation?: boolean) => boolean;
  verifyEmail: (email: string) => Promise<boolean>;
  emailStatus?: {
    isValidating: boolean;
    alreadyExists: boolean;
  };
}

export const useSettlementNavigation = ({
  formData,
  setStep,
  setErrors,
  validateStep1,
  validateStep2,
  verifyEmail,
  emailStatus = { isValidating: false, alreadyExists: false }
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
  const handleNextStep = async (): Promise<boolean> => {
    console.log("handleNextStep called for step:", sessionStorage.getItem('settlementFormStep') || "1");
    
    const currentStep = parseInt(sessionStorage.getItem('settlementFormStep') || "1");
    
    if (currentStep === 1) {
      console.log("Running validateStep1 with data:", formData);
      
      // Always run validation - this will set errors via setErrors inside validateStep1
      const isValid = validateStep1(formData);
      console.log("Step 1 validation result:", isValid, "Form data:", formData);
      
      if (isValid) {
        console.log("Moving to step 2");
        saveFormState();
        setStep(2);
        return true;
      } else {
        console.log("Step 1 validation failed - errors should be displayed");
        // Explicitly ensure any error states in the UI are shown
        return false;
      }
    } 
    else if (currentStep === 2) {
      // Check if email validation is still in progress
      if (emailStatus.isValidating) {
        console.log("Email validation in progress, waiting...");
        setErrors({ attorneyEmail: "Please wait for email validation to complete" });
        return false;
      }
      
      // Check if email already exists according to the status
      if (emailStatus.alreadyExists) {
        console.log("Email already exists according to status, cannot proceed");
        setErrors({ 
          attorneyEmail: "This email is already associated with settlements. Please log in or use a different email." 
        });
        return false;
      }
      
      // Perform an additional real-time check to ensure email doesn't exist
      if (formData.attorneyEmail) {
        console.log("Performing final email verification before proceeding");
        const emailExists = await verifyEmail(formData.attorneyEmail);
        console.log("Final email verification result:", emailExists);
        
        if (emailExists) {
          console.log("Email exists in final check, cannot proceed");
          setErrors({ 
            attorneyEmail: "This email is already associated with settlements. Please log in or use a different email." 
          });
          return false;
        }
      }
      
      // Always run validation - this will set errors via setErrors inside validateStep2
      const isValid = validateStep2(formData);
      console.log("Step 2 validation result:", isValid);
      
      if (isValid) {
        saveFormState();
        setStep(3);
        return true;
      }
      console.log("Step 2 validation failed - errors should be displayed");
      return false;
    }
    
    // Default case
    return false;
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
