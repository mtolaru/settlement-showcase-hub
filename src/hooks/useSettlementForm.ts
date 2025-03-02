
import { useState } from "react";

interface FormErrors {
  [key: string]: string | undefined;
}

export const useSettlementForm = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  // Function to convert formatted numbers (e.g., $1,000) to plain numbers
  const unformatNumber = (value: string): string => {
    return value.replace(/[^0-9.-]+/g, "");
  };

  // Function to validate step 1 of the settlement form
  const validateStep1 = (formData: any): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Check if amount is provided and is a valid number
    if (!formData.amount) {
      newErrors.amount = "Settlement amount is required";
      isValid = false;
    } else if (isNaN(Number(unformatNumber(formData.amount)))) {
      newErrors.amount = "Please enter a valid number";
      isValid = false;
    }

    // Validate initial offer if provided
    if (formData.initialOffer && isNaN(Number(unformatNumber(formData.initialOffer)))) {
      newErrors.initialOffer = "Please enter a valid number";
      isValid = false;
    }

    // Validate policy limit if provided
    if (formData.policyLimit && isNaN(Number(unformatNumber(formData.policyLimit)))) {
      newErrors.policyLimit = "Please enter a valid number";
      isValid = false;
    }

    // Validate medical expenses if provided
    if (formData.medicalExpenses && isNaN(Number(unformatNumber(formData.medicalExpenses)))) {
      newErrors.medicalExpenses = "Please enter a valid number";
      isValid = false;
    }

    // Check if settlement phase is selected
    if (!formData.settlementPhase) {
      newErrors.settlementPhase = "Please select a settlement phase";
      isValid = false;
    }

    // Check if case type is selected
    if (!formData.caseType) {
      newErrors.caseType = "Please select a case type";
      isValid = false;
    }

    // If "Other" is selected as case type, check if other case type is provided
    if (formData.caseType === "Other" && !formData.otherCaseType) {
      newErrors.otherCaseType = "Please specify the case type";
      isValid = false;
    }

    // Validate case description
    if (!formData.caseDescription || formData.caseDescription.trim().length < 10) {
      newErrors.caseDescription = "Please provide a detailed case description (at least 10 characters)";
      isValid = false;
    }

    // Validate settlement date
    if (!formData.settlementDate) {
      newErrors.settlementDate = "Settlement date is required";
      isValid = false;
    }

    // Set the errors
    setErrors(newErrors);
    return isValid;
  };

  // Function to validate step 2 of the settlement form
  const validateStep2 = (formData: any, skipEmailValidation: boolean = false): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate attorney name
    if (!formData.attorneyName) {
      newErrors.attorneyName = "Attorney name is required";
      isValid = false;
    }

    // Validate attorney email (unless we're skipping email validation)
    if (!skipEmailValidation && (!formData.attorneyEmail || !isValidEmail(formData.attorneyEmail))) {
      newErrors.attorneyEmail = "Valid email is required";
      isValid = false;
    }

    // Validate firm name
    if (!formData.firmName) {
      newErrors.firmName = "Firm name is required";
      isValid = false;
    }

    // Validate location
    if (!formData.location) {
      newErrors.location = "Location is required";
      isValid = false;
    }

    // Set the errors
    setErrors(newErrors);
    return isValid;
  };

  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return {
    errors,
    setErrors,
    validateStep1,
    validateStep2,
    unformatNumber
  };
};
